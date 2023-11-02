import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import React, { useRef } from 'react'

function Scrollbars(props: {
    id?: string
    className?: string
    autoScrollToBottom?: boolean
    initialized?: () => void
    style?: any
    children?: any
}): JSX.Element {
    const { id, className, autoScrollToBottom, initialized, style, children } = props
    const ref = useRef<any>(null)

    // https://kingsora.github.io/OverlayScrollbars/
    // "The scroll function is missing. Planned as a plugin. (WIP)"

    // useEffect(() => {
    //     if (autoScrollToBottom) {
    //         const instance = ref!.current!.osInstance()
    //         console.log('instance: ', instance)
    //         if (instance) instance.scroll([0, '100%'], 500)
    //     }
    // }, [children.length])

    return (
        <OverlayScrollbarsComponent
            id={id}
            className={`${className} scrollbar-theme`}
            options={{ scrollbars: { theme: null, autoHide: 'leave', autoHideDelay: 0 } }}
            ref={ref}
            style={style}
            events={{ initialized }}
        >
            {children}
        </OverlayScrollbarsComponent>
    )
}

Scrollbars.defaultProps = {
    id: null,
    className: null,
    autoScrollToBottom: false,
    initialized: null,
    style: null,
    children: null,
}

export default Scrollbars
