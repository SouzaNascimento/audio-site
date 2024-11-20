const backgroundMusic = new Audio('assets/background-music.mp3');
backgroundMusic.loop = true; // Ativar looping
backgroundMusic.volume = 0.5; // Ajustar volume (0.0 a 1.0)

const soundEffects = {
    "fireball": new Audio('assets/fireball.mp3'),
    "iceblast": new Audio('assets/iceBlast.mp3'),
	"lightningbolt": new Audio('assets/lightningbolt.mp3'),
    "heal": new Audio('assets/heal.mp3'),
	"frontpunch": new Audio('assets/frontpunch.mp3'),
	"aquaboom": new Audio('assets/aquaboom.mp3'),
	"endgame": new Audio('assets/endGame.mp3'),
};


const enemyConfig = {
    name: "Startel",
    skills: [
        { name: "Heal", priority: 1, weight: 0.5, condition: () => enemyHealth <= 30 && enemyMana >= attacks.heal.manaCost },
        { name: "Lightning Bolt", priority: 2, weight: 0.3, condition: () => enemyMana >= attacks.lightningBolt.manaCost },
        { name: "Ice Blast", priority: 3, weight: 0.15, condition: () => enemyMana >= attacks.iceBlast.manaCost },
		{ name: "Front Punch", priority: 4, weight: 0.20, condition: () => enemyMana <= attacks.fireBall.manaCost },
        { name: "Fire Ball", priority: 5, weight: 0.05, condition: () => enemyMana >= attacks.fireBall.manaCost }
    ]
};

const attacks = {
    fireBall: {
        name: "Fire Ball",
        damage: 15,
        manaCost: 20,
        element: "fire",
    },
    iceBlast: {
        name: "Ice Blast",
        damage: 12,
        manaCost: 15,
        element: "ice",
    },
    lightningBolt: {
        name: "Lightning Bolt",
        damage: 20,
        manaCost: 30,
        element: "electricity",
    },
	aquaBoom: {
        name: "Aqua Boom",
        damage: 35,
        manaCost: 55,
        element: "water",
    },
	frontPunch: {
        name: "Front Punch",
        damage: 5,
        manaCost: 0,
        element: "water",
    },
    heal: {
        name: "Heal",
        damage: -20,  // Dano negativo, ou seja, recupera vida
        manaCost: 15,
        element: "heal",
    }
};

function chooseEnemyAttack() {
    // Filtra as habilidades disponíveis que atendem às condições
    const availableSkills = enemyConfig.skills.filter(skill => skill.condition());

    if (availableSkills.length === 0) {
        return "fireball"; // Fallback caso nenhuma habilidade esteja disponível
    }

    // Calcula a soma dos pesos das habilidades disponíveis
    const totalWeight = availableSkills.reduce((sum, skill) => sum + skill.weight, 0);

    // Gera um número aleatório entre 0 e o totalWeight
    let randomChoice = Math.random() * totalWeight;

    // Seleciona a habilidade com base no peso
    for (const skill of availableSkills) {
        if (randomChoice < skill.weight) {
            return skill.name;
        }
        randomChoice -= skill.weight;
    }

    // Retorna uma habilidade padrão como fallback, embora não deva chegar aqui
    return availableSkills[0].name;
}


// Função para tocar a música após interação do usuário
function playBackgroundMusic() {
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
            console.log("A reprodução foi bloqueada pelo navegador:", error);
        });
    }
}



// Adicionar um evento de clique para iniciar a música
document.addEventListener('click', playBackgroundMusic);

// Iniciar a música no primeiro clique do usuário
playBackgroundMusic();

const player = document.getElementById('player');
const enemy = document.getElementById('enemy');

// Definição das variáveis globais
let playerHealth = 100;  // Vida inicial do jogador
let playerMana = 100;    // Mana inicial do jogador
let enemyHealth = 100;   // Vida inicial do inimigo
let enemyMana = 100; 
let currentTurn = "player"; // Inicia com o turno do jogador
 



// Função para atualizar as barras de status
function updateBar(barId, percentage) {
    const barFill = document.querySelector(`#${barId}`);
    if (barFill) {
        barFill.style.width = `${Math.max(0, Math.min(percentage, 100))}%`;
    } else {
        console.error(`Elemento com ID "${barId}" não encontrado.`);
    }
}

// Animação de respiração
function animateBreathing() {
    let scale = 1;
    let growing = true;

    function breathe() {
        if (growing) {
            scale += 0.005;
            if (scale >= 1.05) growing = false;
        } else {
            scale -= 0.005;
            if (scale <= 1) growing = true;
        }
        player.style.transform = `scale(${scale})`;
        enemy.style.transform = `scale(${scale})`;
        requestAnimationFrame(breathe);
    }

    breathe();
}

function getRandomMultiplier() {
    const multipliers = [0.6, 0.7, 0.8, 0.9, 1, 2];
    const randomIndex = Math.floor(Math.random() * multipliers.length); // Escolhe aleatoriamente um índice
    return multipliers[randomIndex];
}
// Função para executar o ataque
function performAttack(attackType) {
    if (currentTurn !== "player") {
        console.log("Não é o turno do jogador.");
        return;
    }

    const attack = attacks[attackType];

    if (!attack) {
        console.error("Ataque inválido!");
        return;
    }

    if (playerMana < attack.manaCost) {
        console.log("Mana insuficiente para realizar o ataque.");
        return;
    }

    playerMana -= attack.manaCost;
    const multiplier = getRandomMultiplier();
    const finalDamage = attack.damage * multiplier;

    if (finalDamage > 0) {
        enemyHealth -= finalDamage;
        enemyHealth = Math.max(0, enemyHealth);
        console.log(`Inimigo sofreu ${finalDamage.toFixed(2)} de dano!`);
        displayDamage(finalDamage, "enemy");
        shakeCharacter(enemy);
		const soundEffect = getSoundEffect(formatSoundName(attack.name));
		playSoundEffect(soundEffect);
    } else {
        playerHealth -= finalDamage;
        playerHealth = Math.min(100, playerHealth);
        console.log(`Jogador se curou em ${Math.abs(finalDamage).toFixed(2)}!`);
        displayHeal(finalDamage, "player");
        shakeCharacter(player);
		const soundEffect = getSoundEffect(formatSoundName(attack.name));
		playSoundEffect(soundEffect);
		
    }

    updateBar('player-mana-fill', playerMana);
    updateBar('player-health-fill', playerHealth);
    updateBar('enemy-health-fill', enemyHealth);
    updateBar('enemy-mana-fill', enemyMana);

    if (enemyHealth <= 0) {
        console.log("Parabéns! Você venceu!");
        resetGame();
        return;
    }

    currentTurn = "enemy";
    setTimeout(enemyTurn, 1000);
}



// Função para exibir o dano sobre o inimigo
function displayDamage(damage, target) {
    const damageDisplay = document.getElementById('damage-display');
    damageDisplay.textContent = `${damage.toFixed(2)} de dano`;
    damageDisplay.style.display = 'block';

    // Coloca o dano acima do inimigo
    const enemyElement = document.getElementById(target);
    const enemyRect = enemyElement.getBoundingClientRect();
    damageDisplay.style.left = `${enemyRect.left + enemyRect.width / 2 - damageDisplay.offsetWidth / 2}px`;
    damageDisplay.style.top = `${enemyRect.top - 30}px`; // Ajuste para posicionar acima do inimigo

    // Esconde o dano após 3 segundos
    setTimeout(() => {
        damageDisplay.style.display = 'none';
    }, 3000);
}


function displayHeal(healAmount, target) {
    const healDisplay = document.getElementById('heal-display');
    healDisplay.textContent = `${Math.abs(healAmount).toFixed(2)} de cura`;
    healDisplay.style.display = 'block';

    // Coloca a cura acima do jogador
    const playerElement = document.getElementById(target);
    const playerRect = playerElement.getBoundingClientRect();
    healDisplay.style.left = `${playerRect.left + playerRect.width / 2 - healDisplay.offsetWidth / 2}px`;
    healDisplay.style.top = `${playerRect.top - 30}px`; // Ajuste para posicionar acima do jogador

    // Esconde a cura após 3 segundos
    setTimeout(() => {
        healDisplay.style.display = 'none';
    }, 3000);
}

// Função para sacudir o personagem (jogador ou inimigo)
function shakeCharacter(character) {
    // Aplica a animação de sacudida
	character.style.animation = 'none';
    character.classList.add('shake');
    
    // Remove a classe de sacudida após o tempo da animação
     setTimeout(() => {
        character.classList.remove('shake');
        
        // Reativa a animação de respiração após a sacudida
        character.style.animation = '';  // Reativa a animação de respiração
    }, 400);  // Duração da sacudida (200ms)
}

// Espera o carregamento completo do conteúdo da página
document.addEventListener("DOMContentLoaded", function() {
    console.log("Testando a busca dos elementos");

    // Verificando se as barras estão sendo encontradas
    console.log(document.querySelector("#player-health-fill"));
    console.log(document.querySelector("#enemy-health-fill"));

    // Atualiza as barras iniciais
    updateBar('player-health-fill', 100);
    updateBar('player-mana-fill', 100);
    updateBar('enemy-health-fill', 100);
    updateBar('enemy-mana-fill', 100);

    // Inicia a animação de respiração
    animateBreathing();

    const attackButtons = document.querySelectorAll('.action-button');

    attackButtons.forEach(button => {
        // Adicionando um eventListener em cada botão de ataque
        button.addEventListener('click', function() {
            const attackType = button.getAttribute('data-attack'); // Pega o tipo de ataque do atributo data-attack
            performAttack(attackType);			// Executa o ataque com o tipo correto
			showSkillMessage('Player', attackType);
        });
    });
});





// Função para executar o ataque
function enemyPerformAttack(attackType) {
    const attack = attacks[formatStringMinus(attackType)];

    if (!attack) {
        console.error("Ataque inválido!");
        return;
    }

    if (enemyMana < attack.manaCost) {
        console.log("Mana insuficiente para realizar o ataque.");
        return;
    }

    enemyMana -= attack.manaCost;
    const multiplier = getRandomMultiplier();
    const finalDamage = attack.damage * multiplier;

    if (finalDamage > 0) {
        playerHealth -= finalDamage;
        playerHealth = Math.max(0, playerHealth);
        console.log(`Player sofreu ${finalDamage.toFixed(2)} de dano!`);
        displayDamage(finalDamage, "player");
        shakeCharacter(player);
		const soundEffect = getSoundEffect(formatSoundName(attack.name));
        playSoundEffect(soundEffect);
    } else {
        enemyHealth -= finalDamage;
        enemyHealth = Math.min(100, enemyHealth);
        console.log(`Enemy se curou em ${Math.abs(finalDamage).toFixed(2)}!`);
        displayHeal(finalDamage, "enemy");
        shakeCharacter(enemy);
		const soundEffect = getSoundEffect(formatSoundName(attack.name));
		playSoundEffect(soundEffect);
    }

    updateBar('player-mana-fill', playerMana);
    updateBar('player-health-fill', playerHealth);
    updateBar('enemy-health-fill', enemyHealth);
    updateBar('enemy-mana-fill', enemyMana);
	checkPlayerHealth();

    if (playerHealth <= 0) {
        console.log("Você perdeu! O inimigo venceu.");
        resetGame();
        return;
    }

    currentTurn = "player";
    console.log("Turno do jogador.");
}




function enemyTurn() {
    showTurnMessage("Turno do inimigo");
	if (currentTurn !== "enemy") {
        console.log("Não é o turno do inimigo.");
        return;
    }
	setTimeout(() => {
		
    const attackType = chooseEnemyAttack();
        enemyPerformAttack(attackType);
        showSkillMessage('Inimigo', attackType);
        setTimeout(playerTurn, 1000); // Delay para retornar ao jogador
    }, 1000);
    currentTurn = "player"; // Retorna o turno para o jogador
}



function resetGame() {
    console.log("Reiniciando o jogo...");

    // Resetando as variáveis de vida e mana
    playerHealth = 100;
    playerMana = 100;
    enemyHealth = 100;
    enemyMana = 100;

    // Atualizando as barras de status
    updateBar('player-health-fill', playerHealth);
    updateBar('player-mana-fill', playerMana);
    updateBar('enemy-health-fill', enemyHealth);
    updateBar('enemy-mana-fill', enemyMana);

    // Resetando o turno para o jogador
    currentTurn = "player";

    // Mensagem de reinício
    console.log("Novo jogo iniciado! Turno do jogador.");
}


function showSkillMessage(actor, skillName) {
    const skillMessage = document.getElementById('skill-message');
    const message = `${actor} usou ${skillName}`;
    skillMessage.textContent = message;
    skillMessage.classList.add('show-message');
	skillMessage.classList.remove('hide-message');

    // Ocultar a mensagem após 2 segundos
    setTimeout(() => {
        skillMessage.classList.remove('show-message');
		skillMessage.classList.add('hide-message');
    }, 4000);
}


function showTurnMessage(message) {
    const turnMessage = document.getElementById('turn-message');
    turnMessage.textContent = message;
    turnMessage.classList.add('show-turn-message');
	turnMessage.classList.remove('hide-turn-message');

    // Remover a mensagem após 1 segundo
    setTimeout(() => {
        turnMessage.classList.remove('show-turn-message');
		turnMessage.classList.add('hide-turn-message');
    }, 1000);
}

function playerTurn() {
    showTurnMessage("Seu turno");
    // Lógica do turno do jogador aqui...
}

function formatSoundName(attackName) {
    return attackName.replace(/\s+/g, '').toLowerCase();  // Garante que seja case insensitive.

}

function playSoundEffect(sound) {
    if (sound instanceof Audio) {
    if (sound) {
		sound.play().catch(error => {
			console.log("Erro ao tentar reproduzir o som:", error);
		});
}

    } else {
        console.error("Som não encontrado ou tipo inválido:", sound);
    }
}


function getSoundEffect(attackName) {
    const formattedName = formatSoundName(attackName);
    return soundEffects[formattedName] || null;
}


// Função para exibir a tela de Game Over
function showGameOverScreen() {
	soundEffect = getSoundEffect(formatSoundName("EndGame"));
    playSoundEffect(soundEffect);
    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.remove('hidden');
	gameOverScreen.classList.add('flex');
}

// Função para ocultar a tela de Game Over e reiniciar o jogo
function hideGameOverScreen() {
    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.add('hidden');
    resetGame();
}

// Listener para o botão de reiniciar
document.getElementById('restart-button').addEventListener('click', hideGameOverScreen);

// Modifique a função que verifica a morte do jogador
function checkPlayerHealth() {
    if (playerHealth <= 0) {
        console.log("Você morreu!");
        showGameOverScreen();
    }
}


// Função para reiniciar o jogo
function restartGame() {
    // Ocultar a tela de "Game Over"
    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.add('hidden');
    gameOverScreen.classList.remove('flex');	// Esconde a tela de game over

    // Resetar as variáveis do jogo
    playerHealth = 100;
    playerMana = 100;
    enemyHealth = 100;
    enemyMana = 100;
    currentTurn = "player";  // Inicia com o turno do jogador

    // Atualizar as barras de status
    updateBar('player-health-fill', playerHealth);
    updateBar('player-mana-fill', playerMana);
    updateBar('enemy-health-fill', enemyHealth);
    updateBar('enemy-mana-fill', enemyMana);

    // Reiniciar a animação de respiração
    animateBreathing();

    // Mostrar a tela de jogo novamente
    showTurnMessage("Seu turno");
}

// Adicionar o evento de clique para reiniciar o jogo
document.getElementById('restart-button').addEventListener('click', restartGame);


function formatStringMinus(input) {
    const noSpaces = input.replace(/\s+/g, ''); // Remove espaços
    return noSpaces.charAt(0).toLowerCase() + noSpaces.slice(1);
}
