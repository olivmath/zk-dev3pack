#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    Address, Env, String, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum AulaState {
    Registration,
    Challenging,
    Closed,
}

#[contracttype]
#[derive(Clone)]
pub struct PubKey {
    pub n: u32,
    pub e: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct AulaData {
    pub name: String,
    pub teacher: Address,
    pub state: AulaState,
    pub students: Vec<Address>,
}

#[contracttype]
pub enum DataKey {
    AulaCounter,
    Aula(u64),
    PubKey(u64, Address),
    Challenge(u64, Address),
    ValidSub(u64, Address),
    Nft(u64, Address),
    NftCounter(u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AulaNotFound = 1,
    NotTeacher = 2,
    WrongState = 3,
    AlreadyRegistered = 4,
    NotRegistered = 5,
    InvalidRsaParams = 6,
    NoChallengeIssued = 7,
    InvalidSignature = 8,
    InvalidMValue = 9,
}

const EV_CREATED: Symbol = symbol_short!("created");
const EV_REGISTER: Symbol = symbol_short!("register");
const EV_CHAL: Symbol = symbol_short!("chal");
const EV_SIG_OK: Symbol = symbol_short!("sig_ok");
const EV_MINT: Symbol = symbol_short!("mint");
const EV_CLOSED: Symbol = symbol_short!("closed");

#[contract]
pub struct AttendanceContract;

#[contractimpl]
impl AttendanceContract {
    /// Qualquer endereço pode criar uma aula — vira dono dela.
    pub fn create_aula(env: Env, caller: Address, name: String) -> u64 {
        caller.require_auth();

        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AulaCounter)
            .unwrap_or(0);
        counter += 1;

        let aula = AulaData {
            name: name.clone(),
            teacher: caller.clone(),
            state: AulaState::Registration,
            students: Vec::new(&env),
        };
        env.storage().persistent().set(&DataKey::Aula(counter), &aula);
        env.storage()
            .instance()
            .set(&DataKey::AulaCounter, &counter);
        env.storage().instance().set(&DataKey::NftCounter(counter), &0u64);

        env.events()
            .publish((EV_CREATED, counter), (caller, name));
        counter
    }

    /// Aluno envia sua chave pública (n, e). Só em Registration.
    pub fn register(env: Env, caller: Address, aula_id: u64, n: u32, e: u32) -> Result<(), Error> {
        caller.require_auth();

        if n < 2 || e < 2 {
            return Err(Error::InvalidRsaParams);
        }

        let mut aula: AulaData = env
            .storage()
            .persistent()
            .get(&DataKey::Aula(aula_id))
            .ok_or(Error::AulaNotFound)?;

        if aula.state != AulaState::Registration {
            return Err(Error::WrongState);
        }
        if env
            .storage()
            .persistent()
            .has(&DataKey::PubKey(aula_id, caller.clone()))
        {
            return Err(Error::AlreadyRegistered);
        }

        env.storage()
            .persistent()
            .set(&DataKey::PubKey(aula_id, caller.clone()), &PubKey { n, e });
        aula.students.push_back(caller.clone());
        env.storage().persistent().set(&DataKey::Aula(aula_id), &aula);

        env.events()
            .publish((EV_REGISTER, aula_id), (caller, n, e));
        Ok(())
    }

    /// Professora lança desafios em batch e muda pra Challenging.
    pub fn issue_challenges(
        env: Env,
        caller: Address,
        aula_id: u64,
        ms: Vec<(Address, u32)>,
    ) -> Result<(), Error> {
        caller.require_auth();

        let mut aula: AulaData = env
            .storage()
            .persistent()
            .get(&DataKey::Aula(aula_id))
            .ok_or(Error::AulaNotFound)?;

        if aula.teacher != caller {
            return Err(Error::NotTeacher);
        }
        if aula.state != AulaState::Registration {
            return Err(Error::WrongState);
        }

        for pair in ms.iter() {
            let (student, m) = pair;
            let pk: PubKey = env
                .storage()
                .persistent()
                .get(&DataKey::PubKey(aula_id, student.clone()))
                .ok_or(Error::NotRegistered)?;
            if m < 2 || m >= pk.n {
                return Err(Error::InvalidMValue);
            }
            env.storage()
                .persistent()
                .set(&DataKey::Challenge(aula_id, student.clone()), &m);
            env.events()
                .publish((EV_CHAL, aula_id), (student, m));
        }

        aula.state = AulaState::Challenging;
        env.storage().persistent().set(&DataKey::Aula(aula_id), &aula);
        Ok(())
    }

    /// Aluno submete s; contrato verifica s^e mod n == m. Reverte se inválido.
    pub fn submit_signature(
        env: Env,
        caller: Address,
        aula_id: u64,
        s: u32,
    ) -> Result<(), Error> {
        caller.require_auth();

        let aula: AulaData = env
            .storage()
            .persistent()
            .get(&DataKey::Aula(aula_id))
            .ok_or(Error::AulaNotFound)?;
        if aula.state != AulaState::Challenging {
            return Err(Error::WrongState);
        }

        let pk: PubKey = env
            .storage()
            .persistent()
            .get(&DataKey::PubKey(aula_id, caller.clone()))
            .ok_or(Error::NotRegistered)?;

        let m: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::Challenge(aula_id, caller.clone()))
            .ok_or(Error::NoChallengeIssued)?;

        if pow_mod(s as u64, pk.e as u64, pk.n as u64) != m as u64 {
            return Err(Error::InvalidSignature);
        }

        env.storage()
            .persistent()
            .set(&DataKey::ValidSub(aula_id, caller.clone()), &true);
        env.events().publish((EV_SIG_OK, aula_id), caller);
        Ok(())
    }

    /// Professora fecha a aula: minta NFT pros ValidSub=true em batch.
    pub fn close_aula(env: Env, caller: Address, aula_id: u64) -> Result<u64, Error> {
        caller.require_auth();

        let mut aula: AulaData = env
            .storage()
            .persistent()
            .get(&DataKey::Aula(aula_id))
            .ok_or(Error::AulaNotFound)?;

        if aula.teacher != caller {
            return Err(Error::NotTeacher);
        }
        if aula.state != AulaState::Challenging {
            return Err(Error::WrongState);
        }

        let mut token_counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NftCounter(aula_id))
            .unwrap_or(0);
        let mut minted: u64 = 0;

        for student in aula.students.iter() {
            let valid: bool = env
                .storage()
                .persistent()
                .get(&DataKey::ValidSub(aula_id, student.clone()))
                .unwrap_or(false);
            if valid {
                token_counter += 1;
                env.storage()
                    .persistent()
                    .set(&DataKey::Nft(aula_id, student.clone()), &token_counter);
                env.events()
                    .publish((EV_MINT, aula_id), (student, token_counter));
                minted += 1;
            }
        }

        env.storage()
            .instance()
            .set(&DataKey::NftCounter(aula_id), &token_counter);

        aula.state = AulaState::Closed;
        env.storage().persistent().set(&DataKey::Aula(aula_id), &aula);
        env.events().publish((EV_CLOSED, aula_id), minted);
        Ok(minted)
    }

    // ────── views ──────

    pub fn get_aula(env: Env, aula_id: u64) -> Option<AulaData> {
        env.storage().persistent().get(&DataKey::Aula(aula_id))
    }

    pub fn get_pubkey(env: Env, aula_id: u64, student: Address) -> Option<PubKey> {
        env.storage()
            .persistent()
            .get(&DataKey::PubKey(aula_id, student))
    }

    pub fn get_challenge(env: Env, aula_id: u64, student: Address) -> Option<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::Challenge(aula_id, student))
    }

    pub fn get_nft(env: Env, aula_id: u64, student: Address) -> Option<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::Nft(aula_id, student))
    }

    pub fn has_valid_sub(env: Env, aula_id: u64, student: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::ValidSub(aula_id, student))
            .unwrap_or(false)
    }

    pub fn aula_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::AulaCounter)
            .unwrap_or(0)
    }
}

/// square-and-multiply modular exponentiation.
/// idêntico ao que o aluno faz na mão no papel.
fn pow_mod(mut base: u64, mut exp: u64, n: u64) -> u64 {
    if n == 1 {
        return 0;
    }
    let mut result: u64 = 1;
    base %= n;
    while exp > 0 {
        if exp & 1 == 1 {
            result = (result * base) % n;
        }
        exp >>= 1;
        base = (base * base) % n;
    }
    result
}

#[cfg(test)]
mod test;
