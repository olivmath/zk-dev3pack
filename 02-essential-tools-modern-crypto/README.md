# S2 — Essential Tools of Modern Cryptography

| | |
|---|---|
| **Data** | 16 de abril de 2026 |
| **Instrutora** | Milica ([@0xMilica](https://x.com/0xMilica)) |
| **Duração** | 1h26 |
| **Vídeo** | https://www.youtube.com/watch?v=Yu0g3TXubhM |
| **Slides** | [`slides-essential-tools.pptx`](./slides-essential-tools.pptx) |
| **Leitura** | [`reading-week1-foundations.pdf`](./reading-week1-foundations.pdf) |
| **Transcrição crua** | [`transcript-raw.md`](./transcript-raw.md) |

---

## Notas estruturadas da aula

### 1. Contextualização e Importância da Criptografia

A criptografia é apresentada não apenas como uma ferramenta técnica, mas como um pilar sociopolítico e de infraestrutura.

- **Privacidade individual e corporativa:** representa a liberdade do indivíduo na sociedade e a proteção dos interesses comerciais das empresas.
- **Segurança na internet:** essencial para o desenvolvimento da web, garantindo conexões seguras entre dispositivos e protegendo comunicações globais.
- **Pilar do blockchain:** a tecnologia blockchain sustenta-se na criptografia para garantir imutabilidade e verificação de dados.
- **Objetivos centrais:**
  - **Segurança de dados:** evitar vazamento de informações sensíveis (contas bancárias, endereços).
  - **Autenticidade:** garantir que o interlocutor é quem afirma ser, prevenindo engenharia social (ex: hacks em contas de Telegram).

### 2. Funções Hash Criptográficas

Funções hash são descritas como ferramentas onipresentes no uso da internet, de senhas a árvores de Merkle.

#### 2.1 Propriedades fundamentais
| # | Propriedade | Descrição |
|---|---|---|
| 1 | **Saída de tamanho fixo** | Independentemente do input, o output (digest) tem sempre o mesmo comprimento |
| 2 | **Determinismo** | O mesmo input sempre resulta no mesmo output |
| 3 | **Irreversibilidade** | É impossível deduzir o input original a partir do output |
| 4 | **Efeito avalanche** | Pequenas alterações no input geram mudanças drásticas no output |

#### 2.2 Demonstração do efeito avalanche
Exemplos práticos com a frase "the fox" demonstram que adicionar palavras ou alterar um único caractere resulta em um digest completamente diferente. No exemplo `hello` vs `Hello` usando SHA-256, a mudança da primeira letra altera toda a sequência de bits do resultado.

#### 2.3 Colisões e integridade
- **Resistência à colisão:** dificuldade de encontrar dois inputs diferentes que gerem o mesmo output.
- **Toy hash (hash de brinquedo):** somar valores ASCII `mod 100` revela que `gentleman` e `elegant man` colidem (são anagramas — mesmas letras). Em funções modernas (SHA-3, Poseidon), o pool de hashes é vasto o suficiente para tornar colisões virtualmente impossíveis na prática.

### 3. Aplicação em blockchain: mineração e integridade

Exemplo do Bitcoin pra ilustrar o papel do hash na estrutura de blocos.

- **Componentes do bloco:** número do bloco, *nonce*, dados e hash do bloco anterior (*previous hash*).
- **Encadeamento:** alterar um único dado em um bloco antigo invalida todos os blocos subsequentes (ficam "vermelhos" na demonstração visual), pois o hash do bloco depende do hash anterior.
- **Dificuldade de mineração:** encontrar um *nonce* que, somado aos dados, resulte em um hash com uma quantidade específica de zeros iniciais (conforme o consenso).

### 4. Criptografia Simétrica

Mesma chave para criptografar e descriptografar.

- **Padrão atual:** AES (*Advanced Encryption Standard*).
- **Mecânica:** Vetores de Inicialização (IV), esquemas de preenchimento (*padding*) e modos de cifra (que dividem o segredo em blocos e aplicam funções como XOR ou rotações).
- **Vantagens:** extremamente rápida e eficiente para grandes volumes de dados.
- **Desvantagem (Problema de Distribuição de Chaves):** como compartilhar a chave secreta de forma segura sem que ela seja interceptada?

### 5. Criptografia Assimétrica e Troca de Chaves

Pares de chaves (Pública e Privada). Resolve a distribuição de chaves, mas é computacionalmente mais lenta.

#### 5.1 Protocolo Diffie-Hellman (DH)
Permite que duas partes gerem um segredo compartilhado sobre um canal inseguro **sem nunca enviar o segredo em si**.

- **Base matemática:** Problema do Logaritmo Discreto (DLP).
- **Analogia das cores:** é fácil misturar cores primárias para obter uma cor derivada, mas extremamente custoso separar a cor derivada para descobrir as proporções originais.

**Passo a passo do protocolo:**
1. **Parâmetros públicos:** Alice e Bob concordam em um módulo primo `p` e um gerador `g`.
2. **Chaves privadas:** Alice escolhe `a` secreto; Bob escolhe `b` secreto.
3. **Troca pública:** Alice envia `A = g^a mod p`. Bob envia `B = g^b mod p`.
4. **Cálculo do segredo:** Alice calcula `S = B^a mod p`. Bob calcula `S = A^b mod p`.
5. **Resultado:** ambos chegam ao mesmo `S` (porque `(g^a)^b = (g^b)^a = g^(ab)`), enquanto um observador (*Eve*) não consegue deduzi-lo.

---

## Comentários técnicos e correções

1. **"Toy hash" — limitação didática.** A soma ASCII `mod 100` falha em todas as propriedades de um hash seguro: não tem efeito avalanche (mudar 'a' pra 'b' altera o resultado em apenas 1 unidade) e é trivialmente reversível. Serve só como ferramenta de intuição.

2. **Vetor de Inicialização (IV) e AES.** O IV é crucial no modo CBC (*Cipher Block Chaining*) para garantir que o mesmo bloco de texto simples resulte em textos cifrados diferentes, prevenindo ataques de dicionário. Sem IV, a criptografia simétrica fica vulnerável a padrões repetitivos. Em AES-GCM, o equivalente é o *nonce*.

3. **Segurança real do DH.** O segredo é "impossível" de reconstruir só para primos suficientemente grandes (≥ 2048 bits). Com `p=17` (exemplo da aula), o espaço de busca é minúsculo e vulnerável a força bruta em milissegundos. Em produção, use grupos de [RFC 3526](https://datatracker.ietf.org/doc/html/rfc3526) ou ECDH (curva 25519).

4. **Logaritmo discreto vs analogia das cores.** A analogia ajuda na intuição, mas a dificuldade real está na **assimetria computacional**: exponenciação modular é fácil (`O(log n)` com square-and-multiply), enquanto resolver `g^x ≡ y mod p` para `x` não tem algoritmo eficiente em tempo polinomial em computadores clássicos. Atenção: **Shor quebra DH em quantum computers** — daí o esforço em pós-quantum.

**Leituras complementares:**
- [FIPS 180-4 — Secure Hash Standard (SHA)](https://csrc.nist.gov/publications/detail/fips/180/4/final)
- [NIST SP 800-38A — Modos de Operação de AES](https://csrc.nist.gov/publications/detail/sp/800-38a/final)
- [RFC 3526 — Grupos DH para IKE](https://datatracker.ietf.org/doc/html/rfc3526)
- [The Joy of Cryptography (Mike Rosulek)](https://joyofcryptography.com/) — livro aberto excelente
- [Cryptopals Set 1-2](https://cryptopals.com/) — desafios práticos de hash, AES, padding oracle

---

## Exercícios

1. **(Conceitual — médio)** Compare e contraste **Resistência à Pré-imagem** e **Resistência à Colisão** em funções hash. Por que a resistência à colisão exige um espaço de saída muito maior (dica: Paradoxo do Aniversário)?
   > *Output esperado:* explicação teórica sobre probabilidade de duplicatas vs inverter uma saída específica.

2. **(Prático — fácil)** Calcule manualmente o segredo compartilhado de Diffie-Hellman com `p=23, g=5`. Alice escolhe `a=6`, Bob escolhe `b=15`. Mostre os valores intermediários `A` e `B` antes do segredo final `S`.
   > *Output esperado:* passo a passo dos cálculos modulares.

3. **(Conceitual — fácil)** Explique o "Problema de Distribuição de Chaves" da criptografia simétrica e como a assimétrica o resolveu.
   > *Output esperado:* texto dissertativo sobre logística de chaves em larga escala.

4. **(Prático — médio)** Implemente em Python uma simulação simples de mineração de bloco (Proof of Work). O script recebe uma string (dados) e encontra um *nonce* que faça `SHA-256(dados + nonce)` começar com quatro zeros (`0000`).
   > *Output esperado:* código funcional e nonce encontrado.

5. **(Conceitual — médio)** O que é o **Efeito Avalanche** e por que ele é crítico para assinaturas digitais? O que aconteceria se uma função hash tivesse um efeito avalanche fraco?
   > *Output esperado:* análise sobre integridade e a impossibilidade de prever mudanças no digest.

6. **(Prático — difícil)** Usando o conceito de "Toy Hash" (soma ASCII `mod 100`), escreva um script ou demonstre manualmente como gerar **três frases diferentes** que resultem no mesmo valor de hash (colisão), além das já citadas na aula.
   > *Output esperado:* conjunto de strings e prova da colisão aritmética.

7. **(Conceitual — difícil)** Explique a relação entre o Problema do Logaritmo Discreto e a segurança do Diffie-Hellman. O que mudaria se alguém descobrisse um algoritmo eficiente para calcular logs discretos em campos finitos?
   > *Output esperado:* discussão sobre complexidade computacional e a quebra da assimétrica moderna.

8. **(Prático — médio)** Use a biblioteca `cryptography` em Python (ou `Web Crypto API`) para criptografar a mensagem `ZK_Bootcamp_2026` usando AES-GCM com chave de 256 bits. Identifique claramente o que é a Chave, o IV/Nonce e o Tag de Autenticação.
   > *Output esperado:* snippet de código e explicação dos componentes da cifra.
