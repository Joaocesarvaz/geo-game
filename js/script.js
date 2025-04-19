document.addEventListener('DOMContentLoaded', () => {
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
    const alternarDistanciaBotao = document.getElementById('alternar-distancia'); // Novo botão
    let mostrarDistanciaDetalhada = false; // Controla o formato da distância

    let listaPaises = [];
    let paisCorreto;
    let tentativasRestantes = 6;
    const palpitesAnteriores = [];
    let jogoAcabou = false;
    let mapaMaximizado = false;

    const botaoDica = document.getElementById('botao-dica');
    const mensagemDica = document.getElementById('mensagem-dica');
    const anuncioContainer = document.getElementById('anuncio-container');
    const obterDicaBotao = document.getElementById('obter-dica');
    const dicaTexto = document.getElementById('dica-texto');
    let dicaSolicitada = false;
    let dicaUsada = false;

    async function carregarPaises() {
        try {
            const response = await fetch('./data/paises.json');
            listaPaises = await response.json();
            selecionarPaisCorreto();
            inicializarAutocompletar(); // Inicializa o autocompletar após carregar os países
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
            return distancia.toFixed(2); // Exibe com duas casas decimais
        } else {
            const distanciaArredondada = distancia / 1000; // Converter para milhar
            if (distanciaArredondada >= 1) {
                return distanciaArredondada.toFixed(1) + ' mil';
            } else {
                return distancia.toFixed(0); // Se menor que 1000 km, mostra em km
            }
        }
    }

    function exibirPalpite(palpitePais, latPalpite, lonPalpite) {
        const palpiteLinha = document.createElement('div');
        palpiteLinha.classList.add('palpite-linha');

        const paisCelula = document.createElement('div');
        paisCelula.classList.add('palpite-celula', 'pais-celula');
        paisCelula.textContent = palpitePais;

        const distanciaTotalKm = calcularDistancia(latPalpite, lonPalpite, paisCorreto.latitude, paisCorreto.longitude);

        const direcaoLat = paisCorreto.latitude > latPalpite ? '↑' : paisCorreto.latitude < latPalpite ? '↓' : '';
        const latContainer = document.createElement('div');
        latContainer.classList.add('palpite-celula', 'coordenada-celula');
        latContainer.innerHTML = `<strong>Latitude:</strong><br><small>Distância: ${formatarDistancia(Math.abs(distanciaTotalKm))} km ${direcaoLat}</small>`;
        latContainer.style.backgroundColor = getColorPorDistancia(Math.abs(distanciaTotalKm), 2000);

        const direcaoLon = paisCorreto.longitude > lonPalpite ? '→' : paisCorreto.longitude < lonPalpite ? '←' : '';
        const lonContainer = document.createElement('div');
        lonContainer.classList.add('palpite-celula', 'coordenada-celula');
        lonContainer.innerHTML = `<strong>Longitude:</strong><br><small>Distância: ${formatarDistancia(Math.abs(distanciaTotalKm))} km ${direcaoLon}</small>`;
        lonContainer.style.backgroundColor = getColorPorDistancia(Math.abs(distanciaTotalKm), 3000);

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
            limparSugestoes(); // Limpa as sugestões após o palpite

            if (palpiteJogador.toLowerCase() === paisCorreto.nome.toLowerCase()) {
                mensagemFeedback.textContent = `Parabéns! Você acertou em ${6 - tentativasRestantes} tentativas! O país era ${paisCorreto.nome}.`;
                jogoAcabou = true;
            } else if (tentativasRestantes === 0) {
                mensagemFeedback.textContent = `Fim das tentativas! O país correto era ${paisCorreto.nome}.`;
                jogoAcabou = true;
            } else {
                mensagemFeedback.textContent = `Tente novamente. Você tem ${tentativasRestantes} tentativas restantes.`;
            }
        } else {
            mensagemFeedback.textContent = "País não encontrado na lista.";
        }
    }

    function mostrarSugestoes(textoDigitado) {
        limparSugestoes();
        if (textoDigitado.length < 2) return; // Mostrar sugestões apenas após digitar pelo menos 2 caracteres

        const sugestoesFiltradas = listaPaises.filter(pais =>
            pais.nome.toLowerCase().startsWith(textoDigitado.toLowerCase())
        );

        sugestoesFiltradas.slice(0, 5).forEach(pais => { // Mostrar no máximo 5 sugestões
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
            mostrarSugestoes(event.target.value); // Mostrar sugestões ao focar (se já houver texto)
        });

        palpitePaisInput.addEventListener('blur', () => {
            setTimeout(limparSugestoes, 200); // Limpar sugestões ao perder o foco (com um pequeno delay)
        });
    }

    alternarDistanciaBotao.addEventListener('click', () => {
        mostrarDistanciaDetalhada = !mostrarDistanciaDetalhada;
        alternarDistanciaBotao.textContent = mostrarDistanciaDetalhada ? 'Mostrar Distância Resumida' : 'Mostrar Distância Detalhada';
        // Refazer a exibição dos palpites anteriores com o novo formato
        palpitesContainer.innerHTML = ''; // Limpa os palpites
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
        } else if (dicaSolicitada && !dicaUsada) {
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

    carregarPaises();
});