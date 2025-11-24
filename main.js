const container = document.getElementById('powersContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.main-btn'); // Botões principais
const subFilterBtns = document.querySelectorAll('[data-subfilter]'); // Botões Habilidade/Poder
const pathBtns = document.querySelectorAll('[data-path]'); // Botões de Caminho (Bruxo/Mago/etc)
const classFiltersDiv = document.getElementById('classFilters');
const classSelector = document.getElementById('classSelector');

// MODAL
const modal = document.getElementById('powerModal');
const modalTitle = document.getElementById('modalTitle');
const modalType = document.getElementById('modalType');
const modalReq = document.getElementById('modalReq');
const modalDesc = document.getElementById('modalDesc');
const closeBtn = document.querySelector('.close-btn');

// --- CONFIGURAÇÃO: Quais botões aparecem para qual classe ---
const classPaths = {
    'arcanista': ['arcanista-base', 'bruxo', 'feiticeiro', 'mago', 'necromante'],
    'inventor': ['inventor-base', 'alquimista'],
    'ladino': ['ladino-base', 'ventanista'],
    'lutador': ['lutador-base', 'atleta'],
    'nobre': ['nobre-base', 'burgues'],
    'bucaneiro': ['bucaneiro-base', 'duelista'],
    'druida': ['druida-base', 'ermitao'],
    'guerreiro': ['guerreiro-base', 'inovador'],
    'barbaro': ['barbaro-base', 'machadodepedra'],
    'bardo': ['bardo-base', 'magimarcialista'],
    'paladino': ['paladino-base', 'santo'],
    'cacador': ['cacador-base', 'seteiro'],
    'cavaleiro': ['cavaleiro-base', 'vassalo'],
    'clerigo': ['clerigo-base', 'usurpador'],
    'treinador': [],
    'frade': [] // Adicione esta linha
    // Classes sem variantes (Guerreiro, etc) não precisam estar aqui; o código esconderá os botões.
};

// Estado Global
let state = {
    mainFilter: 'all',
    selectedClass: 'arcanista',
    subType: 'all',
    path: null
};

// --- FUNÇÕES DE VISUALIZAÇÃO ---

// Função que controla quais botões de variante aparecem
function updatePathButtons() {
    // 1. Esconde todos os botões de caminho primeiro
    pathBtns.forEach(btn => btn.style.display = 'none');

    // 2. Verifica se a classe selecionada tem caminhos configurados
    const allowedPaths = classPaths[state.selectedClass];

    if (allowedPaths) {
        // 3. Mostra apenas os botões que pertencem a essa classe
        pathBtns.forEach(btn => {
            const btnPath = btn.getAttribute('data-path');
            if (allowedPaths.includes(btnPath)) {
                btn.style.display = 'inline-block';
            }
        });
    }

    // 4. Se o filtro atual (state.path) não pertence à nova classe, reseta ele
    if (state.path && (!allowedPaths || !allowedPaths.includes(state.path))) {
        state.path = null;
        pathBtns.forEach(b => b.classList.remove('active'));
        // Opcional: Se quiser ativar o "Padrão" automaticamente para classes com variantes:
        // if (allowedPaths && allowedPaths.includes('inventor-base')) clickPath('inventor-base');
    }
}

// Renderização dos Cards
function renderPowers(powers) {
    container.innerHTML = '';

    if (powers.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color:#777; margin-top:20px;">Nenhum item encontrado para os filtros atuais.</p>';
        return;
    }

    powers.forEach(power => {
        const card = document.createElement('div');

        let extraClass = '';
        if (power.type === 'tormenta') extraClass = 'type-tormenta';
        if (power.subType === 'ability') extraClass += ' type-ability';

        card.className = `power-card ${extraClass}`;
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <div class="power-header">
                <span class="power-name">${power.name}</span>
                <span class="power-type">${translateType(power)}</span>
            </div>
            <div class="power-meta">
                <strong>Pré-requisito:</strong> ${power.req}
            </div>
            <div class="power-desc" style="max-height: 60px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                ${power.desc} 
            </div>
            <div style="font-size: 0.8rem; color: var(--accent-red); margin-top: 10px; font-style: italic;">
                Clique para ver detalhes
            </div>
        `;

        card.addEventListener('click', () => openModal(power));
        container.appendChild(card);
    });
}

function translateType(power) {
    if (power.type === 'class') {
        let text = power.subType === 'ability' ? 'Habilidade' : 'Poder';
        // Mostra o caminho se não for 'all' e não for o padrão
        if (power.pathReq && power.pathReq !== 'all' && power.pathReq !== 'inventor-base') {
            text += ` (${capitalize(power.pathReq)})`;
        }
        return text;
    }
    return power.category || power.type;
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// Lógica de Filtro
function filterPowers() {
    const searchTerm = searchInput.value.toLowerCase();

    const filtered = powersData.filter(power => {
        // 1. Filtro Principal
        if (state.mainFilter !== 'all' && power.type !== state.mainFilter) return false;

        // 2. Logica de Classe
        if (state.mainFilter === 'class') {
            if (power.class !== state.selectedClass) return false;
            if (state.subType !== 'all' && power.subType !== state.subType) return false;

            // Lógica de Caminho (Path)
            if (state.path) {
                // Se um caminho específico está ativo (ex: Alquimista), mostra Geral ('all') + Específico ('alquimista')
                if (power.pathReq !== 'all' && power.pathReq !== state.path) return false;

                // --- NOVO: REGRA DE EXCEÇÃO PARA VASSALO ---
                // Se o filtro for Vassalo, ESCONDE os poderes opcionais gerais ('power' + 'all')
                // Assim, só aparecem as Habilidades de Classe e as Habilidades de Vassalo
                if (state.path === 'vassalo' && power.subType === 'power' && power.pathReq === 'all') {
                    return false;
                }
            } else {
                // Se NENHUM caminho está ativo (visão geral da classe):
                const isVariant = ['bruxo', 'feiticeiro', 'mago', 'necromante',
                    'inventor-base', 'alquimista',
                    'lutador-base', 'atleta',
                    'nobre-base', 'burgues',
                    'bucaneiro-base', 'duelista',
                    'druida-base', 'ermitao',
                    'guerreiro-base', 'inovador',
                    'barbaro-base', 'gigante',
                    'bardo-base', 'magimarcialista',
                    'paladino-base', 'santo',
                    'cacador-base', 'seteiro',
                    'cavaleiro-base', 'vassalo'].includes(power.pathReq);

                if (isVariant) return false;
            }
        }

        // 3. Busca
        const matchesSearch = power.name.toLowerCase().includes(searchTerm) ||
            power.desc.toLowerCase().includes(searchTerm) ||
            power.req.toLowerCase().includes(searchTerm);

        return matchesSearch;
    });

    renderPowers(filtered);
}

// --- EVENT LISTENERS ---

// Botões Principais (Combate, Classe, etc)
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mainFilter = btn.getAttribute('data-filter');

        if (state.mainFilter === 'class') {
            classFiltersDiv.style.display = 'block';
            updatePathButtons(); // ATUALIZA OS BOTÕES AO ENTRAR NA ABA
        } else {
            classFiltersDiv.style.display = 'none';
        }
        filterPowers();
    });
});

// Subfiltros (Habilidade/Poder)
subFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        subFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.subType = btn.getAttribute('data-subfilter');
        filterPowers();
    });
});

// Caminhos (Bruxo, Alquimista, etc)
pathBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            state.path = null;
        } else {
            pathBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.path = btn.getAttribute('data-path');
        }
        filterPowers();
    });
});

// Seletor de Classe
classSelector.addEventListener('change', (e) => {
    state.selectedClass = e.target.value;
    state.path = null; // Reseta o caminho ao mudar de classe
    pathBtns.forEach(b => b.classList.remove('active'));

    updatePathButtons(); // ATUALIZA QUAIS BOTÕES APARECEM
    filterPowers();
});

searchInput.addEventListener('input', filterPowers);

// MODAL LOGIC
function openModal(power) {
    modalTitle.innerText = power.name;
    modalType.innerText = translateType(power);
    modalReq.innerText = power.req;
    modalDesc.innerHTML = power.desc;
    modal.style.display = 'flex';
}
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
document.addEventListener('keydown', (e) => { if (e.key === "Escape") modal.style.display = 'none'; });



// Inicialização
updatePathButtons(); // Garante estado inicial correto
renderPowers(powersData);

// --- LÓGICA DO BOTÃO VOLTAR AO TOPO ---
document.addEventListener('DOMContentLoaded', () => {
    const backToTopBtn = document.getElementById("backToTopBtn");

    if (backToTopBtn) {
        // Monitora a rolagem
        window.addEventListener("scroll", () => {
            // Verifica a rolagem vertical (eixo Y)
            if (window.scrollY > 300) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        });

        // Ação de clicar
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    } else {
        console.warn("Botão 'backToTopBtn' não encontrado no HTML.");
    }
});
