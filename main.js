const container = document.getElementById('powersContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.main-btn'); // Botões principais
const subFilterBtns = document.querySelectorAll('[data-subfilter]'); // Botões Habilidade/Poder
const pathBtns = document.querySelectorAll('[data-path]'); // Botões de Caminho (Bruxo/Mago/etc)
const classFiltersDiv = document.getElementById('classFilters');
const classSelector = document.getElementById('classSelector');
const togglePathsBtn = document.getElementById('togglePathsBtn');
const pathsWrap = document.getElementById('pathsWrap');

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
    path: null,
    complicationFilter: 'all' 
};

// --- UI: mostrar/ocultar "Caminhos" (filtro secundário) ---
function setPathsOpen(open) {
    if (!classFiltersDiv || !pathsWrap || !togglePathsBtn) return;
    classFiltersDiv.classList.toggle('show-paths', open);
    togglePathsBtn.classList.toggle('is-open', open);
    togglePathsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    pathsWrap.setAttribute('aria-hidden', open ? 'false' : 'true');
}

if (togglePathsBtn) {
    togglePathsBtn.addEventListener('click', () => {
        const isOpen = classFiltersDiv.classList.contains('show-paths');
        setPathsOpen(!isOpen);
    });
}

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
    // 5. UI: mostra/oculta o botão "Caminhos" se houver variantes visíveis
    if (togglePathsBtn && pathsWrap) {
        const anyVisible = Array.from(pathBtns).some(b => b.style.display !== 'none');
        togglePathsBtn.style.display = anyVisible ? 'inline-block' : 'none';
        if (!anyVisible) {
            setPathsOpen(false);
        } else {
            // abre automaticamente se já houver um caminho selecionado
            if (state.path) setPathsOpen(true);
        }
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
            <div class="power-desc">
                ${power.desc} 
            </div>
            <div class="power-hint">Clique para ver detalhes</div>
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
    if (power.type === 'complication') {
        return power.class ? `Complicação (${capitalize(power.class)})` : 'Complicação Geral';
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

        if (state.mainFilter === 'complication') {
            // Filtra pela categoria (Geral, Classe, Idade)
            if (state.complicationFilter !== 'all' && power.category !== state.complicationFilter) return false;
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

        const compFiltersDiv = document.getElementById('complicationFilters');
        const notice = document.getElementById('complicationNotice');

        if (state.mainFilter === 'complication') {
            compFiltersDiv.style.display = 'flex';
            if (notice) notice.style.display = 'flex';
        } else {
            compFiltersDiv.style.display = 'none';
            if (notice) notice.style.display = 'none';
        }
        
        filterPowers();
    });
});

const compFilterBtns = document.querySelectorAll('[data-compfilter]');

compFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        compFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.complicationFilter = btn.getAttribute('data-compfilter');
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
if (classFiltersDiv) classFiltersDiv.style.display = 'none';  // começa oculto
setPathsOpen(false);

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

// ============================================================
//  CARRINHO DE PODERES
// ============================================================

let cart = JSON.parse(localStorage.getItem('selectedPowers')) || [];
let _currentPower = null; // poder aberto no modal

const cartFab = document.getElementById('cartFab');
const cartCount = document.getElementById('cartCount');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartList = document.getElementById('cartList');
const cartEmpty = document.getElementById('cartEmpty');
const cartExportBtn = document.getElementById('cartExportBtn');
const cartClearBtn = document.getElementById('cartClearBtn');
const modalAddToCart = document.getElementById('modalAddToCart');

// --- Abrir/fechar painel ---
function openCart() {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('active');
}
function closeCart() {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('active');
}
cartFab.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

// --- Verifica se poder já está no carrinho ---
function inCart(power) {
    return cart.some(p => p.name === power.name && p.type === power.type);
}

// --- Atualiza UI ---
function renderCart() {
    const count = cart.length;

    // FAB badge
    cartCount.textContent = count;
    cartCount.classList.toggle('zero', count === 0);

    // Lista vazia vs. lista
    if (count === 0) {
        cartEmpty.classList.remove('hidden');
        cartList.classList.add('hidden');
    } else {
        cartEmpty.classList.add('hidden');
        cartList.classList.remove('hidden');
        cartList.innerHTML = '';
        cart.forEach((power, idx) => {
            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${power.name}</div>
                    <div class="cart-item-meta">${translateType(power)} · Req: ${power.req}</div>
                </div>
                <button class="cart-item-remove" title="Remover" data-idx="${idx}">✕</button>
            `;
            cartList.appendChild(li);
        });

        // Listeners de remover
        cartList.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-idx'));
                cart.splice(i, 1);
                renderCart();
                updateModalCartBtn();
            });
        });
        localStorage.setItem('selectedPowers', JSON.stringify(cart));
    }

    // Botões de ação
    cartExportBtn.disabled = count === 0;
    cartClearBtn.disabled = count === 0;
}

// --- Botão "Adicionar ao Carrinho" no modal ---
function updateModalCartBtn() {
    if (!_currentPower) return;
    const already = inCart(_currentPower);
    modalAddToCart.textContent = already ? 'Remover do Carrinho' : '＋ Adicionar ao Carrinho';
    modalAddToCart.classList.toggle('in-cart', already);
}

modalAddToCart.addEventListener('click', () => {
    if (!_currentPower) return;
    if (inCart(_currentPower)) {
        cart = cart.filter(p => !(p.name === _currentPower.name && p.type === _currentPower.type));
    } else {
        cart.push(_currentPower);
    }
    renderCart();
    updateModalCartBtn();
});

// --- Limpar tudo ---
cartClearBtn.addEventListener('click', () => {
    if (!confirm('Remover todos os poderes do carrinho?')) return;
    cart = [];
    renderCart();
    updateModalCartBtn();
});

// --- Enviar para a Ficha (via localStorage, igual ao script_itens.js) ---
cartExportBtn.innerText = "🚀 Enviar para a Ficha";

cartExportBtn.addEventListener('click', () => {
    if (cart.length === 0) return;

    // 1. Carrega os dados atuais da ficha para não apagar nada
    let fichaRaw = localStorage.getItem('t20SheetData');
    let fichaData = fichaRaw ? JSON.parse(fichaRaw) : {};
    if (!fichaData.classAbilities) fichaData.classAbilities = [];

    // 2. Mapeia os poderes do carrinho para o formato { name, desc } da ficha
    const poderesParaEnviar = cart.map(power => ({
        name: power.name,
        desc: (power.req && power.req !== '-' ? `Req: ${power.req}\n` : '') + power.desc
    }));

    // 3. Adiciona à seção de Poderes & Habilidades (sem apagar o que já existe)
    fichaData.classAbilities = fichaData.classAbilities.concat(poderesParaEnviar);

    // 4. Salva no localStorage compartilhado (mesmo domínio: nicholemos.github.io)
    localStorage.setItem('t20SheetData', JSON.stringify(fichaData));

    alert(`${poderesParaEnviar.length} poder(es) enviado(s) para a ficha com sucesso!\n\nA ficha será aberta em uma nova aba.`);

    // 5. Abre a ficha em uma nova aba
    window.open('https://nicholemos.github.io/ficha/', '_blank');
});


// --- Patch no openModal para rastrear poder atual ---
const _origOpenModal = openModal;
window.openModal = function (power) {
    _currentPower = power;
    _origOpenModal(power);
    updateModalCartBtn();
};

// Inicialização
renderCart();
