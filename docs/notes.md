### Convert SVG to JSX

https://svg2jsx.com/

### Draggable arrows between react components

https://www.npmjs.com/package/react-xarrows
https://codesandbox.io/s/drag-anim-with-draggable-t2sht?fontsize=14&hidenavigation=1&theme=dark

### Animate list transitions

https://stackoverflow.com/questions/75935047/how-to-add-sliding-animation-on-elements-reordered-using-element-insertbefore

### Animate css grid

https://www.youtube.com/watch?v=L80_E6G18II

### Audio wave form visualiser w/ normalisation

https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/

### Build source map

cd into `build/static/js`
run `source-map-explorer *.js --html result.html` to generate source map as result.html file

### Check for updates in package.json dependencies

npx npm-check-updates -u

### Run eslint on all files in src folder

npx eslint --fix src

### Restore Postgres DB from SQL text dump file and access data (used for Discorse migrations)

Unzip the source GZ file

Open PGAdmin and create a new database

Open Window Command Prompt as administrator and cd into the folder with the unzipped dump file

`C:\Users\jhwei\Desktop\<folder>`

run `psql -U postgres dbname < dump.sql`

(where 'postgres' = the username used in PGAdmin, 'dbname' = the database name used in PGAdmin, and 'dump.sql' = the dump file)

After extracting the data, open `Databases > (dbname) > Schemas > Tables` in PGAdmin then right click and select `View/Edit Data` to view a tables contents

import Client from pg package:
`const { Client } = require('pg')`

initialize and connect to client:
`const client = new Client({ host: 'localhost', user: 'postgres', port: 5432, password: 'root', database: 'test' })`
`client.connect()`

query client with raw SQL queries:
`client.query('SELECT * FROM users', (error, result) => { if (error) { ... } else { result.rows... })`
