# A criptografia que você usa hoje vai quebrar — e ninguém sabe quando

Em algum momento entre 2030 e 2040 — talvez antes, talvez nunca, ninguém consegue marcar a data com a régua na mão — alguém vai ligar um computador quântico grande o suficiente para rodar o algoritmo de Shor contra uma chave RSA de 2048 bits. Quando isso acontecer, e for público, três coisas vão virar pó simultaneamente: o cadeado do seu navegador, sua chave de Bitcoin, e a maioria das provas zero-knowledge que existem hoje.

Esse texto é sobre por que isso é verdade, por que você ainda dorme tranquilo essa noite, e o que muda no seu trabalho com criptografia se você levar esse prazo a sério.

---

## O que está em jogo

Quase toda a criptografia de chave pública moderna repousa numa mesma intuição: existem operações matemáticas que são fáceis de fazer numa direção e absurdamente difíceis de desfazer. É fácil multiplicar 23 por 47 e dar 1.081. É difícil, dado 1.081, descobrir que ele é o produto de 23 e 47. Quando você troca esses números por primos de 1.024 bits, "difícil" vira "todos os computadores do mundo trabalhando juntos por mais tempo que a idade do universo".

RSA inteiro é construído nessa assimetria. Diffie-Hellman também. Curvas elípticas, idem — só trocam fatoração por logaritmo discreto, que tem o mesmo perfil de dificuldade. Pareamentos bilineares em curvas (a base de Groth16, KZG, PLONK, e portanto da maioria dos zk-SNARKs em produção) também caem na mesma categoria.

Em 1994, Peter Shor demonstrou um algoritmo que, **em um computador quântico**, fatora inteiros em tempo polinomial. E que, com pequenas adaptações, também resolve o logaritmo discreto. Em silício clássico, atacar RSA-2048 leva milhares de anos. Em silício quântico, com hardware suficiente, leva horas. A assimetria some. A criptografia some junto.

A pergunta que sobra não é *se* — é *quando*.

---

## Por que ainda não estamos sob ataque

A boa notícia é que "hardware suficiente" é onde a coisa engasga. O algoritmo de Shor existe em papel há 30 anos; ninguém fatorou nada não-trivial com ele.

O problema é que o computador quântico real não é um computador quântico ideal. Os qubits físicos atuais — pedaços de matéria condensada, íons aprisionados, fótons em cavidades ópticas — são frágeis. Eles **decoerem**: qualquer interação com o ambiente, qualquer vibração térmica, qualquer fóton perdido, embaralha o estado. A IBM hoje opera processadores com cerca de mil qubits físicos, resfriados a temperaturas próximas do zero absoluto. Para rodar Shor contra RSA-2048 você precisa de algo na ordem de **20 milhões de qubits físicos**, organizados em códigos de correção de erro que transformam ~1.000 físicos em 1 lógico estável.

A diferença entre "mil qubits físicos" e "20 milhões de qubits físicos com correção de erro" não é uma questão de mais investimento — é uma questão de descobertas científicas e de engenharia que ainda não aconteceram. Talvez aconteçam em cinco anos. Talvez em vinte. Talvez precisemos de uma abordagem completamente diferente. Os roadmaps das grandes empresas (IBM, Google, IonQ) prometem milhões de qubits para o final desta década — promessas de roadmap são, historicamente, otimistas.

Em paralelo, o NIST conduziu desde 2016 um processo de padronização de **criptografia pós-quântica** (PQC) — algoritmos cuja segurança não cai com Shor. Em 2024 saíram os primeiros padrões: **Kyber** para troca de chaves, **Dilithium** para assinaturas, **SPHINCS+** para casos onde se quer apenas hashes. O Chrome, o iMessage, e o Signal já usam Kyber em produção. A migração existe e está em curso.

---

## Mas há um ataque acontecendo agora

A dimensão temporal tem um detalhe sinistro: nem todo dado expira no momento em que é trocado.

Considere uma sessão TLS 1.3 efêmera entre você e seu banco. A chave foi negociada agora, usada por trinta segundos, descartada. Mesmo que alguém tenha gravado o tráfego, recuperar a chave daqui a dez anos não dá acesso a nada — o conteúdo já foi consumido e a chave nunca mais será relevante.

Agora considere um backup cifrado de 2024 com dados médicos sensíveis, ou uma mensagem de Signal trocada em 2018 contendo uma estratégia comercial que ainda vale em 2035. Ou cabos submarinos por onde passa tráfego diplomático. Esses dados *valem* mesmo descriptografados anos depois. E é público que algumas agências estatais — NSA confirmou em documentos do Snowden, agências chinesas e russas se presume — armazenam tráfego cifrado *especificamente* para descriptografar quando o quantum maturar. O nome do ataque é **harvest now, decrypt later**.

Para qualquer dado com horizonte de relevância maior que cinco ou dez anos, o ataque já começou. Você só vai descobrir depois.

---

## A peça matemática que muda tudo

Toda a estranheza do quantum computing decorre de uma única decisão de modelagem: as probabilidades não são números reais, são números complexos.

Num bit clássico, você tem zero ou um. Num qubit, você tem uma combinação:

```
|ψ⟩ = α |0⟩ + β |1⟩
```

onde `α` e `β` são números complexos. A probabilidade de medir 0 é `|α|²`; de medir 1 é `|β|²`; e essas duas têm que somar 1.

Por que complexos e não simplesmente reais entre 0 e 1? Porque um número complexo carrega duas informações: uma magnitude e uma **fase** (um ângulo). A magnitude vira probabilidade quando você mede. A fase, perdida no quadrado, ainda governa o que acontece **antes** de você medir, quando os estados se combinam.

Essa fase é o que permite **interferência**: dois caminhos para o mesmo resultado podem se reforçar (interferência construtiva) ou se cancelar (destrutiva). Em probabilidade clássica, dois caminhos para um mesmo resultado sempre somam. Em probabilidade quântica, eles podem se anular.

Algoritmos quânticos são fundamentalmente coreografias dessa interferência: você prepara um estado em superposição de todas as possibilidades, faz uma operação que produz padrões diferentes para respostas certas e erradas, e usa interferência destrutiva para cancelar as erradas e construtiva para amplificar as certas. Quando você mede no fim, a resposta certa cai no seu colo com altíssima probabilidade.

A analogia que mais ajuda — não é precisa, mas guia a intuição — é uma moeda girando. Enquanto gira, ela não é cara nem coroa: carrega informação parcial sobre as duas. Se você para a moeda (mede), o estado colapsa para um lado, com probabilidade que depende de como ela estava girando. Mas enquanto girava, dá para fazer coisas com ela que você não consegue fazer com uma moeda parada.

---

## O algoritmo de Shor, em palavras

Fatorar um número grande `N = p · q` parece um problema irredutível. Shor mostrou que ele se reduz a um problema diferente: **encontrar a ordem de um elemento**. Você escolhe um inteiro `a` ao acaso (coprimo com `N`), e procura o menor `r` tal que `a^r ≡ 1 (mod N)`. Esse `r` se chama ordem. Uma vez que você o tem, alguma aritmética clássica simples extrai os fatores `p` e `q` a partir de `gcd(a^(r/2) ± 1, N)`.

Achar a ordem é o problema duro. Em clássico, é tão duro quanto fatorar diretamente. Mas em quântico, há um atalho. Você cria uma superposição de **todos** os valores possíveis de `x` simultaneamente, calcula `f(x) = a^x mod N` para todos eles em paralelo (entanglement), e aplica uma **transformada de Fourier quântica** sobre o resultado. A transformada de Fourier extrai a frequência fundamental de um sinal periódico — e `f(x)` é periódica com período `r`. Quando você mede, a saída concentra-se em múltiplos de `1/r`. Algumas execuções e você reconstrói `r`. Algumas multiplicações clássicas e você tem `p` e `q`.

A diferença de complexidade é abismal. O melhor algoritmo clássico conhecido — o crivo do número geral — leva tempo subexponencial: aproximadamente `exp((log N)^(1/3))`. Shor leva tempo polinomial: `O((log N)³)`. Em escala humana: o que levaria mais que a idade do universo, leva uma tarde.

---

## O que isso significa para zero-knowledge

Aqui mora a parte que mais interessa para quem está construindo aplicações ZK. Nem todos os sistemas de prova caem com Shor. A divisão é nítida:

| Sistema | Base matemática | Sobrevive a Shor? |
|---|---|---|
| Groth16, PLONK, KZG | pareamentos em curvas elípticas | **Não** |
| Bulletproofs | logaritmo discreto | **Não** |
| **STARKs** (FRI) | apenas funções de hash | **Sim** |
| Halo2 / IPA | logaritmo discreto | **Não** |

A diferença é estrutural. Sistemas baseados em pairings ou logaritmo discreto dependem da dificuldade do mesmo problema que Shor resolve. Sistemas baseados apenas em hashes — STARKs sendo o exemplo mais maduro — dependem da dificuldade de inverter funções de hash, que **não** caem com Shor. O melhor que um adversário quântico consegue contra uma função de hash é o algoritmo de Grover, que dá apenas uma aceleração quadrática (`O(√N)` em vez de `O(N)`). Para neutralizar Grover, basta dobrar o tamanho do hash. STARKs já são desenhados com folga suficiente para isso.

Se você está escrevendo um circuito hoje para um sistema que precisa funcionar daqui a quinze anos — pense num registro fundiário, num ID nacional, num timestamp de propriedade intelectual — a escolha do sistema de prova é uma decisão de longo prazo que merece atenção. Groth16 é mais barato e mais maduro, mas tem prazo de validade. STARKs são mais caros e ainda em maturação, mas atravessam o evento quântico ilesos.

Para algo efêmero — uma transação de DEX, uma autenticação de sessão — qualquer um serve. Para algo permanente, escolha pensando em 2040.

---

## A foto agora

Vale fazer um inventário rápido de onde a criptografia que sustenta o ecossistema cripto se posiciona nesse mapa.

Bitcoin usa ECDSA sobre a curva secp256k1. Cai com Shor. Endereços que **nunca** receberam o pubkey expostos (P2PKH não-gastos) ficam protegidos um tempo a mais — você só vê o hash da chave pública, não a chave em si. Mas no momento em que você gasta de um endereço, a chave pública aparece na blockchain e pode ser atacada. Há propostas (BIP-360 e similares) para migrar para esquemas pós-quânticos, mas é uma reforma constitucional do protocolo, leva anos.

Ethereum tem o mesmo problema com ECDSA, agravado pelo fato de que cada transação revela a chave pública. Os zk-rollups que rodam encima — zkSync, StarkNet, Polygon zkEVM — estão divididos: zkSync e Polygon usam Groth16/PLONK (vulneráveis), StarkNet usa STARKs (resistentes). A escolha não foi feita por consciência pós-quântica, foi feita por trade-offs de tamanho de prova, mas o resultado prático é que StarkNet sobrevive ao evento quântico melhor que os primos.

Sistemas de identidade ZK — Worldcoin, Polygon ID, Sismo — são quase todos Groth16/PLONK. Um ID com prazo de validade de cinco anos é tolerável. Um ID que está vinculado à sua identidade física para o resto da vida é problemático.

---

## O que fazer hoje

Não há motivo para pânico. Há motivos para planejar.

Em sistemas que você está desenhando do zero hoje com horizonte longo: prefira primitivas pós-quânticas onde possível. STARKs onde precisar de prova ZK. SPHINCS+ ou Dilithium onde precisar de assinatura. Kyber para troca de chaves. A latência e o tamanho são piores que os clássicos, mas estão melhorando rápido e a alternativa é desenhar para ficar obsoleto.

Em sistemas existentes: faça um inventário de quais dados, se interceptados hoje, ainda valeriam alguma coisa em 2035. Esses dados precisam migrar para envelope pós-quântico antes desse prazo, mesmo que o conteúdo continue sendo trocado por canais clássicos.

Em educação: invista uma tarde lendo sobre lattice-based cryptography. É a familia de algoritmos que vai dominar a próxima década e tem zero relação com o que você aprendeu sobre RSA e curvas elípticas. A intuição é diferente, a matemática é diferente, e quem não estiver familiarizado vai perder oportunidades de design e auditoria.

E — talvez o mais importante para quem trabalha com criptografia aplicada — pare de tratar "quando o quantum chegar" como um evento futuro abstrato. O ataque "harvest now, decrypt later" significa que, para uma classe inteira de dados, o evento já começou. Só a parte de descriptografar é que vai esperar.

---

> *Notas baseadas na sessão **"Quantum Computing Foundations"** — uma aula surpresa ministrada por **Milica** ([@0xMilica](https://x.com/0xMilica)) no dev3pack ZK & Privacy Bootcamp em 30 de abril de 2026, no lugar do tema originalmente agendado (Semaphore Protocol).*
> *[▶︎ Vídeo da aula](https://www.youtube.com/watch?v=RoYL_Lx3CCA) · [transcrição crua](./transcript-raw.md)*

### Para continuar

- [Yanofsky & Mannucci — *Quantum Computing for Computer Scientists*](https://www.cambridge.org/core/books/quantum-computing-for-computer-scientists/8AEA723BEE5CC9F5C03FDD4BA850C711) — recomendado pela instrutora; o ponto de entrada certo se você sabe álgebra linear.
- [Nielsen & Chuang — *Quantum Computation and Quantum Information*](https://www.cambridge.org/highereducation/books/quantum-computation-and-quantum-information/) — referência canônica.
- [Quantum.country](https://quantum.country/) — primer interativo de Andy Matuschak e Michael Nielsen com spaced repetition embutido.
- [NIST PQC Standardization](https://csrc.nist.gov/projects/post-quantum-cryptography) — Kyber, Dilithium, SPHINCS+ em detalhe.
- [Shor (1994) — paper original no arXiv](https://arxiv.org/abs/quant-ph/9508027)
- [Vitalik — *Quantum Computers and Bitcoin* (2024)](https://vitalik.eth.limo/general/2024/03/29/qc.html) — implicações práticas para blockchain.
- [Qiskit Textbook](https://qiskit.org/textbook/) — para escrever circuitos quânticos de verdade no browser.
