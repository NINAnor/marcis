import MapContext from "../map";
import { useContext, useEffect } from 'react';


export default function Lazy({ lazy }) {
    const { setLazy } = useContext(MapContext);

    useEffect(() => {
        setLazy(lazy)
    }, [lazy]);

    return null;
}