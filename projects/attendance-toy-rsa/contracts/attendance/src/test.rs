#![cfg(test)]

use super::{AttendanceContract, AttendanceContractClient, AulaState, Error};
use soroban_sdk::{testutils::Address as _, vec, Address, Env, IntoVal, String};

const N: u32 = 77;
const E: u32 = 7;
// d = 43 (chave privada que o aluno guarda no papel)
// vetores verificados na mão:
//   m=2 → s=30 ; m=3 → s=38 ; m=5 → s=26

fn setup() -> (Env, AttendanceContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(AttendanceContract, ());
    let client = AttendanceContractClient::new(&env, &contract_id);
    let teacher = Address::generate(&env);
    (env, client, teacher)
}

// ─────────────────────────────── happy path ───────────────────────────────

#[test]
fn full_flow_single_student() {
    let (env, client, teacher) = setup();
    let student = Address::generate(&env);

    let aula_id = client.create_aula(&teacher, &String::from_str(&env, "Aula 23/04"));
    assert_eq!(aula_id, 1);

    client.register(&student, &aula_id, &N, &E);
    let aula = client.get_aula(&aula_id).unwrap();
    assert_eq!(aula.state, AulaState::Registration);
    assert_eq!(aula.students.len(), 1);

    client.issue_challenges(
        &teacher,
        &aula_id,
        &vec![&env, (student.clone(), 2u32)],
    );
    assert_eq!(client.get_aula(&aula_id).unwrap().state, AulaState::Challenging);
    assert_eq!(client.get_challenge(&aula_id, &student), Some(2));

    // m=2, d=43 → s = 2^43 mod 77 = 30
    client.submit_signature(&student, &aula_id, &30);
    assert!(client.has_valid_sub(&aula_id, &student));

    let minted = client.close_aula(&teacher, &aula_id);
    assert_eq!(minted, 1);
    assert_eq!(client.get_aula(&aula_id).unwrap().state, AulaState::Closed);
    assert_eq!(client.get_nft(&aula_id, &student), Some(1));
}

#[test]
fn multiple_students_with_mixed_outcomes() {
    let (env, client, teacher) = setup();
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let c = Address::generate(&env);

    let id = client.create_aula(&teacher, &String::from_str(&env, "turma"));
    client.register(&a, &id, &N, &E);
    client.register(&b, &id, &N, &E);
    client.register(&c, &id, &N, &E);

    client.issue_challenges(
        &teacher,
        &id,
        &vec![
            &env,
            (a.clone(), 2u32),
            (b.clone(), 3u32),
            (c.clone(), 5u32),
        ],
    );

    // a e b assinam certo, c não submete
    client.submit_signature(&a, &id, &30);
    client.submit_signature(&b, &id, &38);

    let minted = client.close_aula(&teacher, &id);
    assert_eq!(minted, 2);
    assert_eq!(client.get_nft(&id, &a), Some(1));
    assert_eq!(client.get_nft(&id, &b), Some(2));
    assert_eq!(client.get_nft(&id, &c), None);
}

// ─────────────────────────────── vetores RSA ───────────────────────────────

#[test]
fn verified_signature_vectors() {
    let (env, client, teacher) = setup();
    let student = Address::generate(&env);
    let id = client.create_aula(&teacher, &String::from_str(&env, "v"));
    client.register(&student, &id, &N, &E);

    for (m, s) in [(2u32, 30u32), (3, 38), (5, 26)] {
        // fresh aula por vetor (simpler do que reset)
        let id2 = client.create_aula(&teacher, &String::from_str(&env, "v"));
        let st = Address::generate(&env);
        client.register(&st, &id2, &N, &E);
        client.issue_challenges(&teacher, &id2, &vec![&env, (st.clone(), m)]);
        client.submit_signature(&st, &id2, &s);
        assert!(client.has_valid_sub(&id2, &st), "m={} s={} should be valid", m, s);
    }
    let _ = id; // silence warning
}

// ─────────────────────────────── erros ───────────────────────────────

#[test]
fn register_in_wrong_state_fails() {
    let (env, client, teacher) = setup();
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let id = client.create_aula(&teacher, &String::from_str(&env, "x"));
    client.register(&a, &id, &N, &E);
    client.issue_challenges(&teacher, &id, &vec![&env, (a.clone(), 2u32)]);
    // aula já saiu de Registration
    let err = client.try_register(&b, &id, &N, &E).err().unwrap().unwrap();
    assert_eq!(err, Error::WrongState);
}

#[test]
fn issue_by_non_teacher_fails() {
    let (env, client, teacher) = setup();
    let stranger = Address::generate(&env);
    let a = Address::generate(&env);
    let id = client.create_aula(&teacher, &String::from_str(&env, "x"));
    client.register(&a, &id, &N, &E);
    let err = client
        .try_issue_challenges(&stranger, &id, &vec![&env, (a.clone(), 2u32)])
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::NotTeacher);
}

#[test]
fn invalid_signature_reverts_but_can_retry() {
    let (env, client, teacher) = setup();
    let student = Address::generate(&env);
    let id = client.create_aula(&teacher, &String::from_str(&env, "x"));
    client.register(&student, &id, &N, &E);
    client.issue_challenges(&teacher, &id, &vec![&env, (student.clone(), 2u32)]);

    // assinatura errada reverte
    let err = client
        .try_submit_signature(&student, &id, &99)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::InvalidSignature);
    assert!(!client.has_valid_sub(&id, &student));

    // retry com a correta funciona
    client.submit_signature(&student, &id, &30);
    assert!(client.has_valid_sub(&id, &student));
}

#[test]
fn m_out_of_range_fails() {
    let (env, client, teacher) = setup();
    let student = Address::generate(&env);
    let id = client.create_aula(&teacher, &String::from_str(&env, "x"));
    client.register(&student, &id, &N, &E);

    // m = 0
    let err = client
        .try_issue_challenges(&teacher, &id, &vec![&env, (student.clone(), 0u32)])
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::InvalidMValue);

    // m >= n
    let err = client
        .try_issue_challenges(&teacher, &id, &vec![&env, (student.clone(), 77u32)])
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::InvalidMValue);
}

#[test]
fn duplicate_register_fails() {
    let (env, client, teacher) = setup();
    let student = Address::generate(&env);
    let id = client.create_aula(&teacher, &String::from_str(&env, "x"));
    client.register(&student, &id, &N, &E);
    let err = client
        .try_register(&student, &id, &N, &E)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::AlreadyRegistered);
}

#[test]
fn close_by_non_teacher_fails() {
    let (env, client, teacher) = setup();
    let stranger = Address::generate(&env);
    let a = Address::generate(&env);
    let id = client.create_aula(&teacher, &String::from_str(&env, "x"));
    client.register(&a, &id, &N, &E);
    client.issue_challenges(&teacher, &id, &vec![&env, (a.clone(), 2u32)]);
    let err = client
        .try_close_aula(&stranger, &id)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::NotTeacher);
}

#[test]
fn submit_without_challenge_fails() {
    let (env, client, teacher) = setup();
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let id = client.create_aula(&teacher, &String::from_str(&env, "x"));
    client.register(&a, &id, &N, &E);
    client.register(&b, &id, &N, &E);
    // só A recebe challenge
    client.issue_challenges(&teacher, &id, &vec![&env, (a.clone(), 2u32)]);
    // B tenta assinar sem ter desafio
    let err = client
        .try_submit_signature(&b, &id, &30)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::NoChallengeIssued);
}
