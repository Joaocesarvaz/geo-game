document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const loginForm = document.getElementById('login-form');
    const nomeLoginInput = document.getElementById('nome-login');
    const sobrenomeLoginInput = document.getElementById('sobrenome-login');
    const botaoLogin = document.getElementById('botao-login');
    const loginError = document.getElementById('login-error');
    const gameHeader = document.querySelector('header');
    const gameMain = document.querySelector('main');

    const palpitesContainer = document.getElementById('palpites-container');
    const palpitePaisInput = document.getElementById('palpite-pais');
    const enviarPalpiteBotao = document.getElementById('enviar-palpite');
    const mensagemFeedback = document.getElementById('mensagem-feedback');
    const maximizarMapaBotao = document.getElementById('maximizar-mapa');
    const mapaReferenciaDiv = document.getElementById('mapa-referencia');
    const mapaReferenciaContainerDiv = document.getElementById('mapa-referencia-container');
    const sugestoesContainer = document.createElement('ul');
    sugestoesContainer.id = 'sugestoes-paises';
    palpitePaisInput.parentNode.insertBefore(sugestoesContainer, palpitePaisInput.nextSibling);
    const alternarDistanciaBotao = document.getElementById('alternar-distancia');
    const telaVitoria = document.getElementById('tela-vitoria');
    const mensagemVitoria = document.getElementById('mensagem-vitoria');
    const botaoReiniciarVitoria = document.getElementById('botao-reiniciar-vitoria');
    const telaDerrota = document.getElementById('tela-derrota');
    const mensagemDerrota = document.getElementById('mensagem-derrota');
    const botaoReiniciarDerrota = document.getElementById('botao-reiniciar-derrota');

    let listaPaises = [];
    let paisCorreto;
    let tentativasRestantes = 6;
    const palpitesAnteriores = [];
    let jogoAcabou = false;
    let mapaMaximizado = false;
    let mostrarDistanciaDetalhada = false;

    const botaoDica = document.getElementById('botao-dica');
    const mensagemDica = document.getElementById('mensagem-dica');
    const anuncioContainer = document.getElementById('anuncio-container');
    const obterDicaBotao = document.getElementById('obter-dica');
    const dicaTexto = document.getElementById('dica-texto');
    let dicaSolicitada = false;
    let dicaUsada = false;

    // Função para salvar informações de login no localStorage
    function salvarLogin(nomeCompleto, acessos) {
        localStorage.setItem('usuarioLogado', JSON.stringify({ nome: nomeCompleto, acessos: acessos }));
    }

    // Função para verificar se o usuário já está logado
    function verificarLogin() {
        const usuarioLogado = localStorage.getItem('usuarioLogado');
        if (usuarioLogado) {
            const usuario = JSON.parse(usuarioLogado);
            exibirJogo(usuario.nome, usuario.acessos);
            return true;
        }
        return false;
    }// Função para lidar com o login
    function efetuarLogin() {
        const nome = nomeLoginInput.value.trim();
        const sobrenome = sobrenomeLoginInput.value.trim();

        if (!nome || !sobrenome) {
            loginError.textContent = "Por favor, digite seu nome e sobrenome.";
            loginError.style.display = 'block';
            return;
        }

        const nomeCompletoTentativa = `${nome} ${sobrenome}`;
        const usuariosRegistrados = localStorage.getItem('usuarios');
        let usuarios = usuariosRegistrados ? JSON.parse(usuariosRegistrados) : {};

        if (usuarios[nomeCompletoTentativa]) {
            usuarios[nomeCompletoTentativa].acessos++;
            salvarLogin(usuarios[nomeCompletoTentativa].nome, usuarios[nomeCompletoTentativa].acessos);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            exibirJogo(usuarios[nomeCompletoTentativa].nome, usuarios[nomeCompletoTentativa].acessos);
        } else {
            // Verificar se já existe um usuário com o mesmo nome (ignorando sobrenome)
            const nomeUnico = Object.keys(usuarios).every(key => {
                const partes = key.split(' ');
                return partes[0].toLowerCase() !== nome.toLowerCase();
            });

            if (nomeUnico) {
                usuarios[nomeCompletoTentativa] = { nome: nomeCompletoTentativa, acessos: 1 };
                salvarLogin(nomeCompletoTentativa, 1);
                localStorage.setItem('usuarios', JSON.stringify(usuarios));
                exibirJogo(nomeCompletoTentativa, 1);
            } else {
                loginError.textContent = "Já existe um usuário com este nome. Por favor, use um nome diferente.";
                loginError.style.display = 'block';
            }
        }
    }

    // Função para exibir o jogo e ocultar a tela de login
    function exibirJogo(nomeUsuario, acessos) {
        loginContainer.style.display = 'none';
        gameHeader.style.display = 'block';
        gameMain.style.display = 'flex';
        console.log(`Bem-vindo(a), ${nomeUsuario} (Acessos: ${acessos})!`);
        mensagemFeedback.textContent = `Bem-vindo(a), ${nomeUsuario}!`; // Mensagem de boas-vindas no jogo
        carregarPaises();
        inicializarMapa(); // Inicializa o mapa agora, após o login
    }
    // Event listener para o botão de login
    botaoLogin.addEventListener('click', efetuarLogin);

    // Permitir login ao pressionar Enter nos campos de nome e sobrenome
    sobrenomeLoginInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            efetuarLogin();
        }
    });
    nomeLoginInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            // Se Enter for pressionado no nome, foca no sobrenome
            sobrenomeLoginInput.focus();
        }
    });

    // Verificar se o usuário já está logado ao carregar a página
    if (!verificarLogin()) {
        loginContainer.style.display = 'flex'; // Mostrar tela de login se não estiver logado
        gameHeader.style.display = 'none';
        gameMain.style.display = 'none';
    }

    async function carregarPaises() {
        try {
            const response = await fetch('./data/paises.json');
            listaPaises = await response.json();
            selecionarPaisCorreto();
            inicializarAutocompletar();
        } catch (error) {
            console.error("Erro ao carregar os países:", error);
            mensagemFeedback.textContent = "Erro ao carregar o jogo.";
        }
    }

    function atualizarMapaReferencia(latitude, longitude) {
        if (window.mapaReferencia) {
            window.mapaReferencia.setView([latitude, longitude], 3);
        }
    }

    function selecionarPaisCorreto() {
        paisCorreto = listaPaises[Math.floor(Math.random() * listaPaises.length)];
        console.log("País correto:", paisCorreto.nome, paisCorreto.latitude, paisCorreto.longitude);
    }

    function calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = degParaRad(lat2 - lat1);
        const dLon = degParaRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(degParaRad(lat1)) * Math.cos(degParaRad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function degParaRad(deg) {
        return deg * (Math.PI / 180);
    }

    function formatarDistancia(distancia) {
        if (mostrarDistanciaDetalhada) {
            return distancia.toFixed(2);
        } else {
            const distanciaArredondada = distancia / 1000;
            if (distanciaArredondada >= 1) {
                return distanciaArredondada.toFixed(1) + ' mil';
            } else {
                return distancia.toFixed(0);
            }
        }
    }

    function exibirPalpite(palpitePais, latPalpite, lonPalpite) {
        const palpiteLinha = document.createElement('div');
        palpiteLinha.classList.add('palpite-linha');

        const paisCelula = document.createElement('div');
        paisCelula.classList.add('palpite-celula', 'pais-celula');
        paisCelula.textContent = palpitePais;

        const distanciaLat = calcularDistancia(latPalpite, lonPalpite, paisCorreto.latitude, lonPalpite);
        const distanciaLon = calcularDistancia(latPalpite, lonPalpite, latPalpite, paisCorreto.longitude);

        const direcaoLat = paisCorreto.latitude > latPalpite ? '↑' : paisCorreto.latitude < latPalpite ? '↓' : '';
        const latContainer = document.createElement('div');
        latContainer.classList.add('palpite-celula', 'coordenada-celula');
        latContainer.innerHTML = `<strong>Latitude:</strong><br><small>Distância: ${formatarDistancia(distanciaLat)} km ${direcaoLat}</small>`;
        latContainer.style.backgroundColor = getColorPorDistancia(distanciaLat, 2000);

        const direcaoLon = paisCorreto.longitude > lonPalpite ? '→' : paisCorreto.longitude < lonPalpite ? '←' : '';
        const lonContainer = document.createElement('div');
        lonContainer.classList.add('palpite-celula', 'coordenada-celula');
        lonContainer.innerHTML = `<strong>Longitude:</strong><br><small>Distância: ${formatarDistancia(distanciaLon)} km ${direcaoLon}</small>`;
        lonContainer.style.backgroundColor = getColorPorDistancia(distanciaLon, 3000);

        palpiteLinha.appendChild(paisCelula);
        palpiteLinha.appendChild(latContainer);
        palpiteLinha.appendChild(lonContainer);
        palpitesContainer.appendChild(palpiteLinha);
    }
    function getColorPorDistancia(distancia, maxDistancia) {
        const intensidade = Math.min(1, distancia / maxDistancia);
        const vermelho = Math.round(255 * intensidade);
        const verde = Math.round(255 * (1 - intensidade));
        return `rgb(${vermelho}, ${verde}, 0)`;
    }

    function verificarPalpite() {
        if (tentativasRestantes <= 0 || jogoAcabou) return;

        const palpiteJogador = palpitePaisInput.value.trim();
        if (!palpiteJogador) return;

        const paisPalpitado = listaPaises.find(pais => pais.nome.toLowerCase() === palpiteJogador.toLowerCase());

        if (paisPalpitado) {
            exibirPalpite(palpiteJogador, paisPalpitado.latitude, paisPalpitado.longitude);
            atualizarMapaReferencia(paisPalpitado.latitude, paisPalpitado.longitude);
            palpitesAnteriores.push(palpiteJogador);
            palpitePaisInput.value = "";
            tentativasRestantes--;
            limparSugestoes();

            if (palpiteJogador.toLowerCase() === paisCorreto.nome.toLowerCase()) {
                mensagemVitoria.textContent = `Você acertou em ${6 - tentativasRestantes} tentativas! O país era ${paisCorreto.nome}.`;
                telaVitoria.style.display = 'flex';
                jogoAcabou = true;
            } else if (tentativasRestantes === 0) {
                mensagemDerrota.textContent = `Fim das tentativas! O país correto era ${paisCorreto.nome}.`;
                telaDerrota.style.display = 'flex';
                jogoAcabou = true;
            } else {
                mensagemFeedback.textContent = `Tente novamente. Você tem ${tentativasRestantes} tentativas restantes.`;
            }
        } else {
            mensagemFeedback.textContent = "País não encontrado na lista.";
        }
    }

    function reiniciarJogo() {
        palpitesContainer.innerHTML = '';
        mensagemFeedback.textContent = '';
        dicaTexto.style.display = 'none';
        tentativasRestantes = 6;
        palpitesAnteriores.length = 0;
        jogoAcabou = false;
        dicaUsada = false;
        dicaSolicitada = false;
        mensagemDica.style.display = 'block';
        anuncioContainer.style.display = 'none';
        selecionarPaisCorreto();
        atualizarMapaReferencia(0, 0);
        telaVitoria.style.display = 'none';
        telaDerrota.style.display = 'none';
    }

    function mostrarSugestoes(textoDigitado) {
        limparSugestoes();
        if (textoDigitado.length < 2) return;

        const textoMinusculo = textoDigitado.toLowerCase();
        const sugestoesFiltradas = listaPaises.filter(pais => {
            const nomeMinusculo = pais.nome.toLowerCase();
            return nomeMinusculo.includes(textoMinusculo);
        });

        if (paisCorreto && !sugestoesFiltradas.some(sugestao => sugestao.nome.toLowerCase() === paisCorreto.nome.toLowerCase()) && paisCorreto.nome.toLowerCase().includes(textoMinusculo)) {
            sugestoesFiltradas.unshift(paisCorreto);
        }

        sugestoesFiltradas.slice(0, 5).forEach(pais => {
            const li = document.createElement('li');
            li.textContent = pais.nome;
            li.classList.add('sugestao-item');
            li.addEventListener('click', () => {
                palpitePaisInput.value = pais.nome;
                limparSugestoes();
            });
            sugestoesContainer.appendChild(li);
        });
    }

    function limparSugestoes() {
        sugestoesContainer.innerHTML = '';
    }

    function inicializarAutocompletar() {
        palpitePaisInput.addEventListener('input', (event) => {
            mostrarSugestoes(event.target.value);
        });

        palpitePaisInput.addEventListener('focus', (event) => {
            mostrarSugestoes(event.target.value);
        });

        palpitePaisInput.addEventListener('blur', () => {
            setTimeout(limparSugestoes, 200);
        });
    }

    alternarDistanciaBotao.addEventListener('click', () => {
        mostrarDistanciaDetalhada = !mostrarDistanciaDetalhada;
        alternarDistanciaBotao.textContent = mostrarDistanciaDetalhada ? 'Mostrar Distância Resumida' : 'Mostrar Distância Detalhada';
        palpitesContainer.innerHTML = '';
        palpitesAnteriores.forEach(palpite => {
            const paisPalpitado = listaPaises.find(pais => pais.nome.toLowerCase() === palpite.toLowerCase());
            if (paisPalpitado) {
                exibirPalpite(palpite, paisPalpitado.latitude, paisPalpitado.longitude);
            }
        });
    });

    enviarPalpiteBotao.addEventListener('click', verificarPalpite);

    palpitePaisInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            verificarPalpite();
        }
    });

    if (maximizarMapaBotao && mapaReferenciaDiv && mapaReferenciaContainerDiv) {
        maximizarMapaBotao.addEventListener('click', () => {
            mapaReferenciaContainerDiv.classList.toggle('maximizado');
            document.getElementById('container-principal').classList.toggle('mapa-centralizado');
            mapaMaximizado = !mapaMaximizado;
            maximizarMapaBotao.textContent = mapaMaximizado ? 'Minimizar' : 'Maximizar';

            if (window.mapaReferencia) {
                window.mapaReferencia.invalidateSize();
            }
        });
    }

    botaoDica.addEventListener('click', () => {
        if (!jogoAcabou && !dicaUsada && tentativasRestantes < 6 && !dicaSolicitada) {
            mensagemDica.style.display = 'none';
            anuncioContainer.style.display = 'block';
            dicaSolicitada = true;
        } else if (dicaUsada) {
            mensagemFeedback.textContent = "Você já usou a dica nesta rodada.";
        } else if (tentativasRestantes === 6) {
            mensagemFeedback.textContent = "Faça pelo menos uma tentativa antes de pedir uma dica.";
        } else if (dicaSolicitada && !dicaUsitada) {
            mensagemFeedback.textContent = "Simule a visualização do anúncio e clique em 'Obter Dica'.";
        }
    });

    obterDicaBotao.addEventListener('click', () => {
        if (dicaSolicitada && !dicaUsada) {
            dicaUsada = true;
            mostrarDica();
            anuncioContainer.style.display = 'none';
        } else if (!dicaSolicitada) {
            mensagemFeedback.textContent = "Clique na lâmpada primeiro para simular o anúncio.";
        } else if (dicaUsada) {
            mensagemFeedback.textContent = "Você já usou a dica.";
        }
    });

    function mostrarDica() {
        if (paisCorreto) {
            const primeiraLetra = paisCorreto.nome.charAt(0).toUpperCase();
            dicaTexto.textContent = `Dica: O nome do país começa com a letra "${primeiraLetra}".`;
            dicaTexto.style.display = 'block';
        }
    }

    botaoReiniciarVitoria.addEventListener('click', reiniciarJogo);
    botaoReiniciarDerrota.addEventListener('click', reiniciarJogo);

    // Verificar login ao carregar a página
    verificarLogin();
    inicializarMapa(); // Garante que o mapa seja inicializado mesmo antes do login (pode ser movido para dentro de exibirJogo se preferir)
});