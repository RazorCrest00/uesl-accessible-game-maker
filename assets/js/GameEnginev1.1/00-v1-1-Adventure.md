---
layout: opencs
title: Adventure Game
permalink: /gamify/adventureGamev1-1
---

<!-- Character selection screen (shown first) -->
<div id="characterSelectContainer"></div>

<!-- Game (hidden until character is chosen) -->
<div id="gameContainer" style="display:none">
    <div id="promptDropDown" class="promptDropDown" style="z-index: 9999"></div>
    <canvas id='gameCanvas'></canvas>
</div>

<script type="module">
    import CharacterSelect from '{{site.baseurl}}/assets/js/GameEnginev1.2/essentials/CharacterSelect.js';
    import WallPlacer from '{{site.baseurl}}/assets/js/GameEnginev1.2/essentials/WallPlacer.js';
    import Game from '{{site.baseurl}}/assets/js/GameEnginev1.1/essentials/Game.js';
    import GameLevelWater from '{{site.baseurl}}/assets/js/GameEnginev1.1/GameLevelWater.js';
    import GameLevelDesert from '{{site.baseurl}}/assets/js/GameEnginev1.1/GameLevelDesert.js';
    import GameLevelEnd from '{{site.baseurl}}/assets/js/GameEnginev1.1/GameLevelEnd.js';
    import GameLevelOverworld from '{{site.baseurl}}/assets/js/GameEnginev1.1/GameLevelOverworld.js';
    import Leaderboard from '{{site.baseurl}}/assets/js/GameEnginev1.1/essentials/Leaderboard.js';
    import { pythonURI, javaURI, fetchOptions } from '{{site.baseurl}}/assets/js/api/config.js';

    const selectContainer = document.getElementById('characterSelectContainer');
    const gameContainer   = document.getElementById('gameContainer');

    new CharacterSelect(selectContainer, {
        path: '{{site.baseurl}}',
        onSelect: (characterData) => {
            localStorage.setItem('selectedCharacter', JSON.stringify(characterData));
            selectContainer.style.display = 'none';
            gameContainer.style.display   = 'block';

            const game = Game.main({
                path: '{{site.baseurl}}',
                pythonURI:    pythonURI,
                javaURI:      javaURI,
                fetchOptions: fetchOptions,
                gameContainer: gameContainer,
                gameCanvas:    document.getElementById('gameCanvas'),
                gameLevelClasses: [GameLevelDesert, GameLevelWater, GameLevelEnd, GameLevelOverworld],
                leaderboardClass: Leaderboard,
                leaderboardOptions: { initialVisibility: 'off' },
            });

            const wp = new WallPlacer(
                gameContainer,
                '{{site.baseurl}}',
                '{{site.baseurl}}/assets/js/GameEnginev1.1/essentials/Barrier.js'
            );
            wp.watchGame(game);
        }
    });
</script>
