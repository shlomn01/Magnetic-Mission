/**
 * The Magnetic Mission - Main Config
 */
(function () {
    window.addEventListener('load', () => {
        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: 960,
            height: 540,
            backgroundColor: '#0d1b2a',
            pixelArt: true,
            roundPixels: true,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: [
                window.BootScene,
                window.TitleScene,
                window.IntroScene,
                window.ShipHubScene,
                window.LabScene,
                window.NavigationScene,
                window.ResearchScene,
                window.BridgeScene,
                window.DialogScene,
                window.QuestLogScene
            ],
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            }
        };
        window.game = new Phaser.Game(config);
    });
})();
