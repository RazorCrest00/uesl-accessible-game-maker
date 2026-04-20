---
layout: opencs
title: Character Select
permalink: /gamify/character-select
---

<link rel="stylesheet" href="{{site.baseurl}}/assets/css/character-select.css">

<!-- Character selection screen (shown first) -->
<div id="characterSelectContainer"></div>

<!-- Game canvas (hidden until a character is chosen) -->
<div id="gameContainer" style="display:none">
    <div id="promptDropDown" class="promptDropDown" style="z-index: 9999"></div>
    <!-- GameEnv will create canvas dynamically -->
</div>

<script type="module">
    import CharacterSelect from '{{site.baseurl}}/assets/js/GameEnginev1.2/essentials/CharacterSelect.js';
    import Core from '{{site.baseurl}}/assets/js/GameEnginev1.2/essentials/Game.js';
    import GameControl from '{{site.baseurl}}/assets/js/GameEnginev1.2/essentials/GameControl.js';
    import GameLevelDesert from '{{site.baseurl}}/assets/js/GameEnginev1.2/GameLevelDesert.js';
    import GameLevelWater from '{{site.baseurl}}/assets/js/GameEnginev1.2/GameLevelBasicWater.js';
    import GameLevelEnd from '{{site.baseurl}}/assets/js/GameEnginev1.2/GameLevelEnd.js';
    import { pythonURI, javaURI, fetchOptions } from '{{site.baseurl}}/assets/js/api/config.js';

    const selectContainer = document.getElementById('characterSelectContainer');
    const gameContainer   = document.getElementById('gameContainer');

    new CharacterSelect(selectContainer, {
        path: '{{site.baseurl}}',
        onSelect: (characterData) => {
            // Persist selection (already done inside CharacterSelect, but ensure fresh copy)
            localStorage.setItem('selectedCharacter', JSON.stringify(characterData));

            // Swap views
            selectContainer.style.display = 'none';
            gameContainer.style.display   = 'block';

            // Launch the adventure game
            Core.main({
                path: '{{site.baseurl}}',
                pythonURI:    pythonURI,
                javaURI:      javaURI,
                fetchOptions: fetchOptions,
                gameContainer: gameContainer,
                gameLevelClasses: [GameLevelDesert, GameLevelWater, GameLevelEnd],
            }, GameControl);
        }
    });
</script>
