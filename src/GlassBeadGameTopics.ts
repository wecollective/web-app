import config from '@src/Config'
// image paths
const arc = `${config.publicAssets}/images/archetopics/`
const lim = `${config.publicAssets}/images/liminal/`

// todo: merge into single array and store topic group as object value

export default {
    archetopics: [
        { name: 'Addiction', imagePath: `${arc}addiction.png`, spaceId: 90 },
        { name: 'Art', imagePath: `${arc}art.png`, spaceId: 69 },
        { name: 'Attention', imagePath: `${arc}attention.png`, spaceId: 76 },
        { name: 'Beauty', imagePath: `${arc}beauty.png`, spaceId: 79 },
        { name: 'Beginning', imagePath: `${arc}beginning.png`, spaceId: 80 },
        { name: 'Birth', imagePath: `${arc}birth.png`, spaceId: 81 },
        { name: 'Cosmos', imagePath: `${arc}cosmos.png`, spaceId: 88 },
        { name: 'Death', imagePath: `${arc}death.png`, spaceId: 73 },
        { name: 'Ego', imagePath: `${arc}ego.png`, spaceId: 82 },
        { name: 'Empathy', imagePath: `${arc}empathy.png`, spaceId: 83 },
        { name: 'End', imagePath: `${arc}end.png`, spaceId: 72 },
        { name: 'Eutopia', imagePath: `${arc}eutopia.png`, spaceId: 84 },
        { name: 'Future', imagePath: `${arc}future.png`, spaceId: 75 },
        { name: 'Game', imagePath: `${arc}game.png`, spaceId: 85 },
        { name: 'Gift', imagePath: `${arc}gift.png`, spaceId: 86 },
        { name: 'History', imagePath: `${arc}history.png`, spaceId: 87 },
        { name: 'Human', imagePath: `${arc}human.png`, spaceId: 78 },
        { name: 'Life', imagePath: `${arc}life.png`, spaceId: 89 },
        { name: 'Paradox', imagePath: `${arc}paradox.png`, spaceId: 74 },
        { name: 'Shadow', imagePath: `${arc}shadow.png`, spaceId: 91 },
        { name: 'Society', imagePath: `${arc}society.png`, spaceId: 71 },
        { name: 'Time', imagePath: `${arc}time.png`, spaceId: 70 },
        { name: 'Truth', imagePath: `${arc}truth.png`, spaceId: 77 },
    ],
    liminal: [
        { name: 'Authentic Relating', imagePath: `${lim}authentic-relating.png`, spaceId: 236 },
        {
            name: 'Collaborative Governance',
            imagePath: `${lim}collaborative-governance.png`,
            spaceId: 245,
        },
        { name: 'Community Building', imagePath: `${lim}community-building.png`, spaceId: 241 },
        { name: 'Embodiment', imagePath: `${lim}embodiment.png`, spaceId: 238 },
        { name: 'Emergence', imagePath: `${lim}emergence.png`, spaceId: 229 },
        { name: 'Existential Risk', imagePath: `${lim}existential-risk.png`, spaceId: 230 },
        { name: 'The Infinite Game', imagePath: `${lim}the-infinite-game.png`, spaceId: 233 },
        { name: 'Integral Theory', imagePath: `${lim}integral-theory.png`, spaceId: 237 },
        { name: 'The Liminal Web', imagePath: `${lim}the-liminal-web.jpg`, spaceId: 226 },
        { name: 'Meditation', imagePath: `${lim}meditation.png`, spaceId: 227 },
        { name: 'Metacrisis', imagePath: `${lim}metacrisis.png`, spaceId: 247 },
        { name: 'Metamodernism', imagePath: `${lim}metamodernism.png`, spaceId: 242 },
        { name: 'Permaculture', imagePath: `${lim}permaculture.jpg`, spaceId: 235 },
        { name: 'Polarisation', imagePath: `${lim}polarisation.png`, spaceId: 244 },
        { name: 'Psychedelic Medicine', imagePath: `${lim}psychedelic-medicine.png`, spaceId: 234 },
        { name: 'Psychotechnology', imagePath: `${lim}psychotechnology.png`, spaceId: 231 },
        { name: 'Sensemaking', imagePath: `${lim}sensemaking.png`, spaceId: 246 },
        { name: 'Shadow Work', imagePath: `${lim}shadow-work.png`, spaceId: 239 },
        { name: 'Stoicism', imagePath: `${lim}stoicism.jpg`, spaceId: 240 },
        { name: 'Systems Change', imagePath: `${lim}systems-change.png`, spaceId: 243 },
        { name: 'Trauma', imagePath: `${lim}trauma.png`, spaceId: 228 },
        { name: 'Wisdom Cultivation', imagePath: `${lim}wisdom-cultivation.png`, spaceId: 232 },
    ],
}
