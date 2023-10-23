import ToyBoxItem from '@components/cards/ToyBoxItem'
import { AccountContext } from '@contexts/AccountContext'
import React, { useContext } from 'react'

function DragItem(): JSX.Element {
    const { dragItem } = useContext(AccountContext)
    const { type, data } = dragItem
    return (
        <div id='drag-item' style={{ position: 'fixed', left: -200 }}>
            {data && <ToyBoxItem type={type} data={data} dragImage />}
        </div>
    )
}

export default DragItem
