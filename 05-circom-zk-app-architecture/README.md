# Circom não é uma linguagem de programação

Você abre seu primeiro arquivo `.circom`, vê palavras familiares — `template`, `signal`, `component` — e seu cérebro de programador faz o que sempre faz: tenta encaixar isso num modelo conhecido. Função? Classe? Módulo? Nada bate. E quando você tenta escrever `if (x > 0) { y = 1 }`, o compilador resmunga, você googla, encontra um Stack Overflow de 2021 dizendo "use `IsZero()` da circomlib", e a sensação é de que algo está errado *com você*.

Não está. Circom não é uma linguagem de programação. É uma **linguagem de descrição de hardware** — uma HDL, prima distante de Verilog e VHDL — adaptada para descrever um tipo muito específico de hardware: o **circuito aritmético** que vira a base de uma prova zero-knowledge. Antes de aprender a sintaxe, você precisa fazer um pequeno reset mental. Esse texto é sobre esse reset.

---

## A confusão começa pelo nome

"Linguagem" carrega bagagem. Uma linguagem de programação descreve **um processo no tempo**: faz isso, depois aquilo, se der ruim repete, retorna o resultado. O fluxo é a essência. Variáveis mudam, loops giram, exceções estouram.

Uma HDL descreve **um objeto no espaço**: aqui tem um fio, ali tem um portão lógico, este fio entra naquele portão e o resultado sai por outro fio. Não há "depois". Tudo existe simultaneamente, como existe simultaneamente o circuito de uma placa-mãe. Quando você escreve VHDL, você não está escrevendo um programa — está desenhando hardware.

Circom faz a mesma coisa, mas o "hardware" final não é silício: é um sistema de equações matemáticas chamado **R1CS** (rank-1 constraint system). E o objetivo desse sistema não é computar — é **deixar-se verificar**. Você descreve um circuito; o compilador transforma em equações; outra ferramenta (snarkjs, geralmente) gera, a partir dessas equações, uma **prova criptográfica** de que alguém sabe valores que satisfazem todas elas, sem revelar quais valores são.

Esse é o tijolo de toda dApp ZK que você já ouviu falar — Tornado Cash, zkSync, Aztec, Worldcoin. Por baixo de cada uma há circuitos Circom (ou seu primo Halo2/Noir) descrevendo o que precisa ser verdade.

---

## O que é um circuito aritmético

Imagine uma planilha. Cada célula é um número. Cada célula computada é uma fórmula que combina outras células com `+` e `*`. Sem `if`, sem `for`, sem strings. Só números num **campo finito** (pense `mod p` para um primo gigante) e duas operações.

Agora imagine que sua tarefa é provar para alguém que existe uma combinação de valores nas células de entrada que faz a célula final dar `42` — sem revelar os valores intermediários. Isso é, em essência, o que um circuito aritmético modela e o que uma prova ZK demonstra.

O detalhe técnico que muda tudo é o seguinte: o sistema de provas (Groth16, PLONK, Halo2) só aceita equações com uma forma muito específica:

```
(combinação linear de sinais) × (combinação linear) = (combinação linear)
```

Uma multiplicação. Uma só. Por equação.

Daí vem a primeira regra estranha de Circom: você não pode escrever `m = a * b * c` em uma linha. Tem que decompor:

```circom
helper <== a * b;
m      <== helper * c;
```

Não é capricho da linguagem. É consequência matemática direta do sistema de provas. Toda vez que você "flatten" um polinômio em mais sinais intermediários, você está pagando o preço de admissão para o teatro do zk-SNARK.

---

## O alfabeto

São três tipos de sinais e três operadores. Pegou estes seis, pegou Circom.

**Sinais** são os fios do circuito. Existem três variantes: input, output e intermediário. Inputs entram externamente — alguns públicos (todo mundo vê), outros privados (só o prover sabe; o verifier confia que existem). Outputs saem do circuito e são sempre públicos. Intermediários são scaffolding interno.

**Operadores** parecem similares mas fazem coisas diferentes:

- `<--` faz só atribuição. O sinal recebe um valor mas o sistema de provas não verifica nada sobre ele.
- `===` faz só restrição. Diz "esses dois sinais têm que ser iguais" — verificável, mas não atribui valor.
- `<==` faz as duas coisas: atribui e verifica.

Em circuito honesto, você usa `<==` em quase tudo. O `<--` existe para casos em que você precisa calcular algo de um jeito que o R1CS não consegue expressar diretamente (uma raiz quadrada, por exemplo) e depois usa `===` para amarrar o resultado a uma restrição que *consegue* ser expressa (`raiz * raiz === entrada`).

A pegadinha clássica — fonte de bugs caros em produção — é usar `<--` e esquecer do `===`. O circuito compila. Os testes do desenvolvedor passam. Mas o sistema fica **underconstrained**: o prover pode forjar uma "witness" com qualquer valor naquele sinal e a prova ainda valida. Auditoria de circuitos zk é, em grande parte, caçar exatamente isso.

---

## Um exemplo que cabe na cabeça

Alguém publica num quadro `commitment = Poseidon(segredo)`. Você jura que sabe o `segredo`. Como provar sem soltar o segredo?

```circom
pragma circom 2.1.6;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

template GuessNumber() {
    signal input  guess;                // privado
    signal input  solutionCommitment;   // público
    signal output answer;               // público (1 = acertou)

    component hasher = Poseidon(1);
    hasher.inputs[0] <== guess;

    component eq = IsEqual();
    eq.in[0] <== hasher.out;
    eq.in[1] <== solutionCommitment;

    answer <== eq.out;
}

component main {public [solutionCommitment]} = GuessNumber();
```

Lê assim: existe um sinal privado `guess`, um sinal público `solutionCommitment`, e um output `answer`. Pega o `guess`, joga no Poseidon, compara o hash com o commitment público, devolve 1 se bate. Quem verifica a prova vê apenas `solutionCommitment` e `answer` — nunca vê `guess`. Mas tem certeza matemática de que existe um `guess` cujo Poseidon coincide com o commitment.

Esse padrão — *provar conhecimento de um pré-imagem* — é o esqueleto de **toda** aplicação ZK. Mude o que está sendo hasheado e você muda o domínio: hash de uma chave secreta vira sistema de identidade; hash de uma raiz Merkle vira airdrops anônimos; hash de um conjunto de credenciais vira KYC privado.

---

## Por que Poseidon e não SHA-256

Pergunta natural: por que não usar SHA-256, que é onipresente? Resposta: porque dentro de um circuito zk, SHA-256 é um pesadelo.

SHA-256 foi desenhado para CPUs e ASICs — operações binárias, deslocamentos, XOR. Tudo isso dentro de um campo finito vira uma quantidade absurda de restrições: ~30.000 para um único hash. O prover demora segundos para gerar uma prova trivial.

Poseidon, MiMC e Rescue são **arithmetic-friendly**: foram desenhados de cima pra baixo para viver dentro de um campo finito. Um hash Poseidon custa ~250 restrições. Cem vezes mais barato. Por isso todo circuito sério usa Poseidon (ou similar) para hashes internos, deixando SHA/Keccak para a borda do sistema (compatibilidade com Ethereum, por exemplo).

A regra aqui é geral: **dentro do circuito, escolha primitivas pensadas para o circuito**. Fora dele, use as primitivas do mundo real. A interface entre os dois mundos é onde mora a complexidade.

---

## Onde escrever sem instalar nada

A barreira de entrada para experimentar Circom costumava ser feia: instalar Rust, baixar o compilador, configurar `snarkjs`, sofrer com versões. O **zkREPL** ([zkrepl.dev](https://zkrepl.dev)) elimina isso. Editor no browser, compilador em WebAssembly, Groth16 e PLONK clicáveis. Você cola o `GuessNumber` acima, define `INPUT = { "guess": 4, "solutionCommitment": "<hash do 4>" }`, aperta Shift+Enter, e em segundos tem uma prova válida.

Não substitui um setup local quando você for pra produção, mas é o caminho mais rápido para construir intuição. Recomendado: passe duas horas só escrevendo circuitinhos absurdos no zkREPL antes de tentar instalar qualquer coisa. Esse tempo paga juros pelo resto da sua jornada com ZK.

---

## A pilha completa, de relance

Circom é só uma das quatro peças de uma dApp ZK funcional. As outras:

A **biblioteca padrão** — `circomlib` — fornece hashes (Poseidon, MiMC), comparadores (IsEqual, LessThan), Merkle trees, EdDSA, conversões bit↔número. Use sempre. Reescrever um comparator em Circom é como reescrever `strcmp` em assembly: tecnicamente possível, profissionalmente irresponsável.

O **gerador de prova** — `snarkjs` — pega o R1CS que Circom emitiu, faz o setup criptográfico, gera a prova e exporta um verificador (em Solidity, geralmente). É a ferramenta que faz a ponte entre o objeto matemático e a infraestrutura blockchain.

O **trusted setup** é o ritual político-criptográfico onde múltiplas pessoas contribuem aleatoriedade que, combinada, produz parâmetros públicos. Se *qualquer uma* delas for honesta e destruir sua share, o sistema é seguro. PLONK precisa do setup uma vez para todos os circuitos (universal); Groth16 precisa de um setup por circuito.

E o **frontend** — JavaScript ou Rust no browser/mobile — que coleta os inputs do usuário, gera o witness localmente, manda a prova para um contrato, recebe o resultado. Aqui não há mistério: é trabalho normal de aplicação, com a peculiaridade de que parte da computação é uma prova ZK.

---

## O reset mental, em uma frase

Programar é dizer ao computador o que fazer. Escrever um circuito Circom é **declarar quais equações precisam ser verdadeiras** para que uma afirmação seja crível. O programa nunca é "executado" no sentido tradicional — ele é compilado para matemática, e essa matemática vira uma prova que qualquer um pode verificar com um celular em milissegundos, sem confiar em quem provou.

Quando esse clique acontece — quando você para de tentar imaginar "o que esse circuito faz quando roda" e começa a pensar "que afirmação esse circuito torna verificável" — Circom para de ser estranha e vira o que ela sempre foi: uma linguagem extraordinariamente direta para descrever hardware criptográfico.

A partir daí, o resto é prática.

---

> *Notas baseadas na sessão **"Intro to Circom & ZK App Architecture"** ministrada por **Milica** ([@0xMilica](https://x.com/0xMilica)) no dev3pack ZK & Privacy Bootcamp em 28 de abril de 2026.*
> *[▶︎ Vídeo da aula](https://www.youtube.com/watch?v=tK2pwF74vcY) · [transcrição crua](./transcript-raw.md) · [leitura preparatória](./reading-week3-circom.pdf)*

### Para continuar

- [docs.circom.io](https://docs.circom.io/) — documentação oficial. Leia "Writing circuits" inteiro.
- [iden3/circomlib](https://github.com/iden3/circomlib) — código-fonte da biblioteca padrão.
- [0xPARC ZK Learning Group](https://learn.0xparc.org/circom/) — workshops mais densos.
- [Vitalik — Quadratic Arithmetic Programs from Zero to Hero](https://medium.com/@VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649) — entender por que R1CS existe.
- [Circomspect](https://github.com/trailofbits/circomspect) (Trail of Bits) e [Picus](https://github.com/Veridise/Picus) (Veridise) — detectores estáticos de bugs underconstrained.
