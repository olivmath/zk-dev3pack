# S1 — Foundations of Cryptography

| | |
|---|---|
| **Data** | 14 de abril de 2026 |
| **Instrutora** | Dra. Melissa (0xMilica) |
| **Duração** | 1h23 |
| **Vídeo** | https://www.youtube.com/watch?v=iFPdgimiFVg |
| **Slides** | [`slides-intro-to-cryptography.pdf`](./slides-intro-to-cryptography.pdf) |
| **Leitura** | [`reading-week1-foundations.pdf`](./reading-week1-foundations.pdf) |
| **Transcrição crua** | [`transcript-raw.md`](./transcript-raw.md) |

---

## Notas estruturadas da aula

### 1. Introdução ao Boot Camp e Conceitos de Zero Knowledge (ZK)

A aula inicia-se estabelecendo o propósito do treinamento: preparar os alunos para compreender as ferramentas e linguagens de **Zero Knowledge Proofs (ZKP)** através do domínio de seus fundamentos. Melissa destaca que, antes de mergulhar em STARKs ou implementações complexas, é essencial entender o "quadro geral" da criptografia.

**O que é ZK?**
Durante uma discussão interativa, os alunos e a instrutora definem ZK como:
- Provar a posse de uma informação ou segredo sem revelá-lo.
- Um protocolo ou "mágica matemática" que permite a verificação de identidade ou transações sem exposição de dados sensíveis.
- Processos que podem ocorrer tanto *on-chain* quanto *off-chain*.

### 2. Objetivos e Pilares da Criptografia

A criptografia é apresentada como a base necessária para as provas de conhecimento zero. Historicamente, surgiu da necessidade militar de ocultar mensagens; se uma mensagem fosse interceptada, toda uma operação poderia ser comprometida. Seus três objetivos centrais são:

| Pilar | Garantia |
|---|---|
| **Confidencialidade** | Apenas o destinatário pretendido tem acesso à mensagem |
| **Integridade** | A mensagem não foi alterada durante o percurso |
| **Autenticidade** | A mensagem realmente se originou da fonte alegada |

### 3. Criptografia Simétrica vs. Assimétrica

A instrutora faz uma distinção fundamental entre os dois tipos de sistemas:

- **Simétrica:** Utiliza a mesma chave para trancar (criptografar) e destrancar (descriptografar) a informação, como a chave física de uma casa.
- **Assimétrica:** Utiliza um par de chaves, onde uma tranca e a outra destranca.

### 4. Criptografia Clássica e Cifras de Substituição

A aula percorre a evolução histórica de mais de 2.000 anos, desde métodos simples de substituição até sistemas modernos.

#### 4.1 Cifra de César (Shift Cipher)
Utilizada por Júlio César para se comunicar com seus generais, consiste em deslocar cada letra do alfabeto por um número fixo de posições.
- **Mecânica:** Se o deslocamento (shift) for 3, 'A' torna-se 'D', 'B' torna-se 'E', etc.
- **Exemplo:** A palavra `CRYPTO` com shift 5 torna-se `HTDUYT`.
- **Fraquezas:** Vulnerável ao **ataque de força bruta** (testar todos os 25/26 deslocamentos) e à **análise de frequência**.

#### 4.2 Cifra de Substituição Geral
Em vez de um deslocamento fixo, cada letra é mapeada para uma letra única e aleatória através de uma matriz de mapeamento (ex: A vira Q).
- **Ponto Forte:** Mais complexa que a de César por não seguir uma lógica linear.
- **Ponto Fraco:** Ainda retém as propriedades de frequência da linguagem original.

#### 4.3 Análise de Frequência
Toda língua possui uma frequência específica de letras (ex: 'A' e 'E' são comuns em línguas europeias). Mesmo criptografada, se o texto for longo o suficiente (ex: 1.000 palavras), um analista pode identificar qual letra criptografada aparece mais vezes e deduzir o mapeamento.

#### 4.4 Cifra de Vigenère
Cifra polialfabética que utiliza uma palavra-chave (keyword) para variar o deslocamento de cada letra.
- **Funcionamento:** A palavra-chave é escrita repetidamente sob o texto original. Cada letra da chave indica o deslocamento para a letra correspondente do texto.
- **Exemplo:** Texto `HELLO` com chave `MATH`:
  - H + M
  - E + A
  - L + T
  - L + H
  - O + M (reinicia a chave)
- **Vantagem:** Letras iguais no texto original podem resultar em letras diferentes no texto cifrado, dificultando a análise de frequência simples.
- **Status:** Já foi considerada inquebrável, mas hoje é facilmente vencida por poder computacional.

### 5. Esteganografia

Diferente da criptografia (que esconde o significado), a esteganografia esconde a **existência** da mensagem. Historicamente, mensagens eram escondidas em imagens, livros ou à vista de todos, mas de forma que apenas um olho treinado (ou com a ferramenta certa) pudesse ver.

### 6. Fundamentos da Teoria dos Números

A criptografia moderna (RSA, Diffie-Hellman, Curvas Elípticas) não se baseia mais em "quebra-cabeças" de letras, mas em matemática robusta.

#### 6.1 Números Primos
São os blocos fundamentais da criptografia moderna. Um número primo é divisível apenas por 1 e por ele mesmo. Verificar se um número muito grande é primo exige tentativas exaustivas de divisão, o que é computacionalmente custoso.

#### 6.2 Máximo Divisor Comum (MDC/GCD)
Conceito utilizado na geração de chaves e verificações de segurança em protocolos criptográficos.

#### 6.3 Aritmética Modular (Aritmética do Relógio)
É o conceito de realizar cálculos dentro de um intervalo finito e fixo.
- **Analogia do Relógio:** Se agora são 19:00h, dizemos que são 7:00h da noite. Isso é `19 mod 12 = 7`.
- **Importância:** Mantém os números dentro de um limite que os computadores conseguem processar e é essencial para operações em curvas elípticas.
- **Exemplos da aula:**
  - `7 * 8 mod 10` → `56 / 10 = 5`, resto **6**
  - `3^4 mod 5` → `81 / 5 = 16`, resto **1**

---

## Comentários técnicos e correções

1. **Esclarecimento sobre Vigenère:** A professora explica que a cifra de Vigenère usa "passwords". Tecnicamente, ela é uma cifra **polialfabética**. Diferente da cifra de César (monoalfabética), uma única letra 'E' no texto original pode se tornar 'X' ou 'M' dependendo da posição da chave, o que "achata" o histograma de frequência.

2. **Precisão Histórica e Técnica:** Melissa menciona que o alfabeto romano tinha 25 letras por não possuir o 'J'. Na verdade, o alfabeto latino clássico tinha 23 letras (faltavam J, U e W). Na criptografia clássica, é comum usar um alfabeto de 25 letras (fundindo I/J) para criar matrizes 5x5 (como na cifra Playfair).

3. **Correção sobre "Inquebrabilidade":** A instrutora menciona que nada é inquebrável, apenas falta poder computacional. **Exceção importante:** o **One-Time Pad (OTP)**. Se a chave for verdadeiramente aleatória, do mesmo tamanho da mensagem e nunca reutilizada, ele é matematicamente inquebrável (sigilo perfeito), independentemente do poder computacional.

4. **Analogia adicional para ZK:** Pense em ZK como o exemplo da "caverna de Ali Babá" ou o "teste das garrafas de refrigerante" (onde você prova que sabe distinguir os sabores sem dizer qual é qual). Isso ajuda a visualizar a separação entre *conhecimento* e *informação*.

**Leituras complementares:**
- [Shannon — A Mathematical Theory of Communication](https://archive.org/details/bstj27-3-379) — base da segurança teórica
- [Rivest, Shamir, Adleman — A Method for Obtaining Digital Signatures and Public-Key Cryptosystems (RSA)](https://people.csail.mit.edu/rivest/rsapaper.pdf)
- [RFC 4492 — ECC for TLS](https://datatracker.ietf.org/doc/html/rfc4492)
- [Cryptopals Crypto Challenges](https://cryptopals.com/) — exercícios clássicos pra praticar tudo isso

---

## Exercícios

1. **(Conceitual — fácil)** Defina Confidencialidade, Integridade e Autenticidade com suas próprias palavras. Por que a Integridade é vital em transações de blockchain?
   > *Output esperado:* texto explicativo diferenciando os três termos.

2. **(Prático — fácil)** Use a Cifra de César com deslocamento `k=7` para criptografar a frase `ZK PRIVACY`. Ignore espaços e trate o alfabeto como circular (`mod 26`).
   > *Output esperado:* string cifrada.

3. **(Conceitual — médio)** Explique como a análise de frequência pode ser usada para quebrar uma cifra de substituição simples, mas falha ao tentar quebrar uma Vigenère com chave longa.
   > *Output esperado:* redação técnica comparando cifras monoalfabéticas vs polialfabéticas.

4. **(Prático — médio)** Implemente em Python ou SageMath uma função que realize a criptografia de Vigenère. Teste com o texto `FOUNDATIONS` e a chave `KEY`.
   > *Output esperado:* código fonte e resultado da cifragem.

5. **(Prático — médio)** Calcule manualmente:
   - `15 * 11 mod 7`
   - `2^10 mod 11` (dica: use propriedades de potências)
   > *Output esperado:* passo a passo e restos finais.

6. **(Conceitual — difícil)** "Números primos são a base da criptografia de chave pública." Prove ou refute esta afirmação considerando dificuldade de fatoração e verificação de primalidade.
   > *Output esperado:* argumentação lógica relacionando custo computacional e segurança.

7. **(Prático/CTF — difícil)** Você interceptou a mensagem cifrada `KHOOR` que sabe ter sido enviada usando a Cifra de César. Sem saber o shift, realize um ataque de força bruta.
   > *Output esperado:* lista das 25 rotações possíveis e identificação da mensagem correta.

8. **(Prático — médio)** Implemente em Python o cálculo do MDC de dois números grandes usando o Algoritmo de Euclides. Teste com `1071` e `462`.
   > *Output esperado:* código e resultado (MDC = 21).
