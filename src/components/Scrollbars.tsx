import React, { useRef } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

const Scrollbars = (props: {
    children: any
    className?: string
    onScrollBottom?: () => void
    onScrollTop?: () => void
}): JSX.Element => {
    const { children, className, onScrollBottom, onScrollTop } = props
    const ref = useRef<OverlayScrollbarsComponent>(null)
    const OSOptions = {
        className: 'os-theme-none',
        callbacks: {
            onScroll: () => {
                const instance = ref!.current!.osInstance()
                const scrollInfo = instance!.scroll()
                if (onScrollBottom && scrollInfo.ratio.y > 0.999) onScrollBottom()
                if (onScrollTop && scrollInfo.ratio.y < 0.001) onScrollTop()
            },
        },
    }

    return (
        <OverlayScrollbarsComponent
            className={`${className} os-host-flexbox scrollbar-theme`}
            options={OSOptions}
            ref={ref}
        >
            {children}
        </OverlayScrollbarsComponent>
    )
}

Scrollbars.defaultProps = {
    className: null,
    onScrollBottom: null,
    onScrollTop: null,
}

export default Scrollbars
