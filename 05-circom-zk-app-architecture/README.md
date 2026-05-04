# S5 — ZK App Architecture & Intro to Circom

| | |
|---|---|
| **Data** | 28 de abril de 2026 |
| **Instrutora** | Milica ([@0xMilica](https://x.com/0xMilica)) |
| **Duração** | 1h45 |
| **Vídeo** | https://www.youtube.com/watch?v=tK2pwF74vcY |
| **Playground** | https://zkrepl.dev (sem instalação local) |
| **Leitura** | [`reading-week3-circom.pdf`](./reading-week3-circom.pdf) |
| **Transcrição crua** | [`transcript-raw.md`](./transcript-raw.md) |

> Primeira aula 100% prática: zero novas teorias, foco em **escrever circuito** num REPL online. A instrutora muda de framing — Circom **não é uma linguagem de programação**, é uma **HDL** (hardware description language). Esse shift de mindset é o conteúdo central.

---

## Notas estruturadas da aula

### 1. Por que Circom não é "uma linguagem comum"

Circom não tem classes, nem interfaces, nem o controle de fluxo que você espera de Python/Solidity/Rust. Ela descreve **circuitos aritméticos**: um grafo de **wires** (sinais) e **gates** (operações) num finite field. Quem já mexeu com VHDL/Verilog sente em casa; quem não, precisa fazer um pequeno reset mental.

| Você está acostumado a | Circom pensa assim |
|---|---|
| `if`, `for`, side effects, mutation | Fluxo é o circuito; loops servem só para *gerar* o circuito em compile-time |
| "Calcular" um valor | **Vincular** um sinal a uma equação que precisa ser satisfeita |
| Função retorna valor | Template emite **constraints** que prover/verifier vão validar |

A frase que resume: *"em vez de dizer 'eu fiz uma multiplicação', o prover diz 'eu satisfaço estas equações'."*

### 2. Vocabulário — wires, gates, signals

**Sinais** são as variáveis do circuito. Três tipos:

| Tipo | Declaração | Papel |
|---|---|---|
| Input | `signal input a;` | entra externamente (público ou privado) |
| Output | `signal output c;` | sai do circuito (geralmente público) |
| Intermediário | `signal helper;` | calculado dentro, não exposto |

**Gates** são as operações que conectam sinais. Cada gate recebe wires, produz wires.

### 3. Operadores — assignment vs constraint

Esse é o ponto mais confundido por iniciantes:

| Operador | Faz | Quando usar |
|---|---|---|
| `<--` | só assignment (sem constraint) | gerar valor "fora" do sistema (raro, usar com cuidado) |
| `===` | só constraint (sem assignment) | enforçar igualdade entre sinais já calculados |
| `<==` | assignment **+** constraint | o que você usa **99% do tempo** |

> ⚠️ Usar `<--` sem um `===` correspondente é a fonte clássica de bug em Circom: o circuito "compila e roda" mas o valor não é checado pelo verifier — *underconstrained circuit*. Audits de Circom buscam exatamente esse padrão.

### 4. Rank-1 Constraint System (R1CS)

R1CS é a forma canônica que Circom emite. Cada constraint tem o formato:

```
(combinação linear) · (combinação linear) = (combinação linear)
```

**Quadrático no máximo.** Significa que multiplicação de **3 ou mais** sinais não cabe em uma única constraint — você precisa de sinais intermediários (helpers).

Exemplo: `m = a · b · c` precisa virar:

```circom
helper <== a * b;
m      <== helper * c;
```

São duas constraints, não uma. Esse "flattening" é *o trabalho* de quem escreve Circom.

### 5. Flattening de polinômios

Polinômio: `f(x) = 3x² + 2x + 2`. Não dá pra escrever `out <== 3*x*x + 2*x + 2;` direto porque `x*x` é não-quadrático junto com o resto. Você flatten para uma árvore de gates:

```
                +
              /   \
             *     2
           /   \
          x     ?
              ...
```

Cada folha é input/constante, cada nó interno é um gate (mul/add). A versão Circom (uma forma):

```circom
template Quadratic() {
    signal input x;
    signal output out;

    signal x2;
    x2  <== x * x;
    out <== 3*x2 + 2*x + 2;
}
```

> A árvore **não precisa estar balanceada**. Otimização vem depois — primeiro, faça compilar.

### 6. Lei de Kirchhoff como mnemônico

Como ajuda mental: trate cada gate como um nó elétrico. **Tudo que entra menos tudo que sai = 0.** Se você está com mais inputs do que sabe gastar, faltou helper. Se está com sinal sobrando sem constraint, vai dar underconstrained.

### 7. Hands-on no zkREPL

Não precisa instalar Rust toolchain — o **zkREPL** (https://zkrepl.dev) compila e roda Circom no browser, com escolha de proving system (Groth16 ou PLONK).

#### Exemplo 1 — `Mul3` (multiplicar 3 inputs)

```circom
pragma circom 2.1.6;

template Mul3() {
    signal input a;
    signal input b;
    signal input c;
    signal output m;

    signal helper;
    helper <== a * b;
    m      <== helper * c;
}

component main = Mul3();

/* INPUT = {
    "a": "3",
    "b": "4",
    "c": "5"
} */
```

Atalho do REPL: **Shift+Enter** para compilar e provar. O `helper` existe **só** porque R1CS é quadrático.

#### Exemplo 2 — `GuessNumber` (commit-and-reveal com Poseidon)

Cenário: alguém publica `solutionCommitment = Poseidon(solution)`. Você quer provar que conhece um `guess` igual a `solution` *sem revelar* `solution`.

```circom
pragma circom 2.1.6;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

template GuessNumber() {
    signal input guess;                  // privado: o palpite
    signal input solutionCommitment;     // público: o hash já publicado
    signal output answer;                // público: 1 se acertou

    component hasher = Poseidon(1);
    hasher.inputs[0] <== guess;

    component eq = IsEqual();
    eq.in[0] <== hasher.out;
    eq.in[1] <== solutionCommitment;

    answer <== eq.out;
}

component main {public [solutionCommitment]} = GuessNumber();
```

> A mecânica do `component`: você está **invocando outro template** como subcomponente. `Poseidon(1)` significa "Poseidon com 1 input"; `IsEqual()` retorna 1 se `in[0] == in[1]`, senão 0.

> ⚠️ A aula esbarrou num bug do REPL: ao mudar o input JSON, o exemplo às vezes mostra resultado em cache. Forçar **Shift+Enter** ou recarregar resolve.

### 8. circomlib — biblioteca padrão

`circomlib` (iden3/circomlib no GitHub) é o equivalente da stdlib em Circom. Templates prontos para:

| Categoria | Templates úteis |
|---|---|
| Hashes | `Poseidon`, `MiMC`, `Pedersen` |
| Comparadores | `IsEqual`, `LessThan`, `GreaterEqThan` |
| Bitwise | `Num2Bits`, `Bits2Num`, `XOR`, `AND` |
| Multiplexers | `Mux1`…`Mux4` |
| Assinaturas | `EdDSA`, `BabyJub` |
| Merkle | `MerkleTreeChecker` |

Inclua via `include "circomlib/<nome>.circom";`. **Não reinvente roda** — qualquer hash/comparador escrito do zero costuma estar errado e/ou underconstrained.

---

## Walkthrough — anatomia de um circuito Circom

```
┌─────────────────────────────────────────────────────────────┐
│  template MeuCircuito() {                                   │
│      signal input  x;          ← públicos por padrão         │
│      signal input  secret;     ← privados se NÃO listados    │
│      signal output y;          ←   em "public [...]"         │
│                                                              │
│      signal h;                 ← helper / intermediário      │
│      h <== x * x;              ← constraint quadrática      │
│      y <== h + secret;         ← constraint linear           │
│  }                                                           │
│                                                              │
│  component main {public [x]} = MeuCircuito();               │
│                                  ↑                           │
│                          declara explicitamente              │
│                          quais inputs são públicos           │
└─────────────────────────────────────────────────────────────┘

         ↓  zkREPL ou snarkjs  ↓

  ┌─────────┐    ┌─────────┐    ┌─────────┐
  │  .r1cs  │ →  │  .wasm  │ →  │  proof  │
  │ R1CS    │    │ witness │    │ Groth16 │
  │ system  │    │ generator│    │ / PLONK │
  └─────────┘    └─────────┘    └─────────┘
```

---

## Comentários técnicos e correções

1. **"Hardware description language" é metáfora forte mas imperfeita.** Circom não vira chip — vira R1CS, depois vira proof. A analogia ajuda no mindset (paralelismo, sem flow imperativo) mas o output final é uma prova zk-SNARK, não bitstream para FPGA.

2. **Pragma version importa.** A aula usa `pragma circom 2.1.6`. Versões anteriores (1.x) tinham sintaxe diferente (sem `<==` etc.). Sempre fixe a versão — circuitos em produção geralmente travam exatamente.

3. **Underconstrained vs overconstrained.** Dois bugs simétricos:

   | Bug | O que acontece | Como detectar |
   |---|---|---|
   | Underconstrained | Prover pode forjar witness inválida que passa | audit manual; ferramentas como Circomspect, Picus |
   | Overconstrained | Provas honestas são rejeitadas | testes de roundtrip prover→verifier |

4. **`signal input` público vs privado.** Confusão comum: por padrão um `signal input` é *witness* (privado). Para marcar como público, você lista no `component main {public [a, b]} = ...`. Tudo que **não** estiver na lista vira parte do witness secreto. Outputs são sempre públicos.

5. **O exemplo `Mul3` exibe a regra-chave do R1CS.** Não é por elegância: é matemática. Groth16/PLONK provam afirmações na forma `A·B = C` onde A, B, C são combinações lineares. Multiplicação de 3 fatores é grau 3 — não cabe.

6. **`Poseidon` foi escolhido em vez de SHA-256/Keccak por um motivo.** Hashes "tradicionais" são desastrosos dentro de circuitos zk: SHA-256 custa ~30k constraints, Poseidon custa ~250. Poseidon, MiMC, Rescue são **arithmetization-friendly**: foram desenhados para finite field aritmético, não para CPU/ASIC. Use-os por dentro do circuito; SHA/Keccak só nas bordas (compatibilidade com Ethereum).

7. **`zkREPL` é ótimo para aprender, ruim para produção.** Compila no browser via WASM, sem trusted setup real. Para circuitos de produção: `circom <arquivo>.circom --r1cs --wasm --sym` localmente + `snarkjs` para Groth16/PLONK + cerimônia MPC própria.

8. **Constraints entre dois outputs?** A pergunta de Yura na aula ficou aberta. Resposta: **sim, é permitido** — `out1 === 2 * out2` é uma constraint válida. Mas raramente faz sentido design-wise: outputs costumam ser independentemente derivados de inputs.

9. **`signal` vs `var` (ausente da aula, mas crítico).** Circom também tem `var` — variáveis comuns de compile-time, **não** vão para o circuito. Útil para loops e cálculos auxiliares na geração do circuito. Não confunda: `var` desaparece após compilar; `signal` vira fio no circuito final.

10. **Próximas peças que faltam.** Esta aula só apresentou Circom. Para construir uma dApp ZK completa você ainda precisa:
    - **snarkjs** — gerar prova/verificar fora do REPL
    - **trusted setup** — Powers of Tau (universal, do Hermez/Polygon) + setup do circuito
    - **verifier on-chain** — `snarkjs zkey export solidityverifier` gera contrato Solidity
    - **frontend** — empacotar witness no browser, chamar verificador

**Leituras complementares:**

- [Circom 2 Docs](https://docs.circom.io/) — referência oficial, leia "Writing circuits" inteiro
- [iden3/circomlib](https://github.com/iden3/circomlib) — código-fonte da stdlib
- [0xPARC ZK Learning Group — Circom Workshop](https://learn.0xparc.org/circom/) — material denso, complementa esta aula
- [Vitalik — Quadratic Arithmetic Programs from Zero to Hero](https://medium.com/@VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649) — entender por que R1CS existe
- [Circomspect](https://github.com/trailofbits/circomspect) — linter/static analyzer da Trail of Bits para circuitos Circom
- [Picus](https://github.com/Veridise/Picus) — detecta underconstrained automaticamente
- [snarkjs](https://github.com/iden3/snarkjs) — toolkit fora do REPL

---

## Exercícios

A instrutora prometeu enviar tarefas via Google Classroom. Sugestões enquanto não chegam:

1. **(Fácil)** Escreva um template `IsEven(n)` que recebe `signal input x` (n bits) e retorna `signal output isEven` (1 se par). Dica: use `Num2Bits(n)` e cheque `bits[0]`.

2. **(Fácil)** Reescreva `Mul3` para `Mul4(a, b, c, d)`. Quantos helpers você precisou? Por quê?

3. **(Médio)** Implemente `Range(min, max)`: prova que `min <= x <= max` sem revelar `x`. Use `LessThan` ou `LessEqThan` de `circomlib/comparators.circom`. Por que esse circuito é útil para *age verification*?

4. **(Médio)** Crie um circuito `MerklePathCheck(depth)` que prove inclusão de uma folha numa Merkle tree de Poseidon, sem revelar a folha. Comece da skeleton de `MerkleTreeChecker` em circomlib.

5. **(Médio)** No exemplo `GuessNumber`, troque Poseidon por uma comparação direta `guess === solution`. Por que isso destrói o protocolo? (Dica: pense no que o verifier vê.)

6. **(Difícil)** Pegue o `Mul3` e introduza um bug **underconstrained**: substitua `<==` por `<--` em uma das linhas e prove que com input `(2, 3, 5)` o `m=30` valida — mas você consegue gerar uma witness com `m=99` que **também valida**.

7. **(Difícil)** Implemente `ZKVoting`: cada eleitor tem uma chave EdDSA, vota `0` ou `1`, e o circuito prova "votei uma vez, sem revelar quem sou nem quem votei". Use `EdDSA` + `MerkleTreeChecker` de circomlib.

8. **(Conceitual)** Compare `Groth16` vs `PLONK` na escolha do REPL. Por que PLONK precisa de trusted setup *universal* (uma vez para todos os circuitos) enquanto Groth16 precisa *por circuito*? Quando você escolheria um vs outro?
