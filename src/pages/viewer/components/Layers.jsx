import { useContext, useMemo, useState } from "react";
import { Tree } from 'react-arborist';
import MapContext from "../map";
import LegendSymbol from "./LegendSymbol";

function Layer({ node, style, dragHandle }) {
  const { map, layers, lazy } = useContext(MapContext);
  const layer = layers[node.data.id];

  const icon = layer && layer.isVisible ? 'fas fa-eye' : 'fas fa-eye-slash';

  const updateVisibility = () => {
    if (layer) {
      map.setLayoutProperty(node.data.id, 'visibility', layer.isVisible ? 'none' : 'visible');
    } else {
      map.addLayer(lazy.layers[node.data.id]);
    }
  }

  const legend = useMemo(() => {
    return layer ? LegendSymbol(layer, map) : LegendSymbol(lazy.layers[node.data.id], map);
  }, [layer, lazy])

  return (
    <div style={style} ref={dragHandle}>
      <div className="row">
        <div className="row grow group" onClick={updateVisibility}>
          <i className={icon}></i>
          <div className="legend">{legend}</div>
          <div className="text-truncate">{node.data.name}</div>
        </div>
        {node.data.download && (<div><a href={node.data.download} download><i className="fas fa-download"></i></a></div>)}
      </div>
    </div>
  );
}

function Group({ node, style, dragHandle }) {
  return (
    <div style={style} ref={dragHandle}>
      <div className="row" >
        <div className="row grow group" onClick={() => node.toggle()}>
          <i className={`fas fa-folder${node.isOpen ? '-open' : '' }`}></i>
          <span className="text-truncate">{node.data.name}</span>
        </div>
        {node.data.download && (<div><a href={node.data.download} download><i className="fas fa-download"></i></a></div>)}
      </div>
    </div>
  );
}

function Child({ node, ...other }) {
  let Component = Group
  if (node.isLeaf) {
    Component = Layer
  }

  return <Component node={node} {...other} />
}

const options = {
  box: "border-box"
}

const ROW_HEIGHT = 30;

function useTreeVisibleNodesCount() {
  const [count, setCount] = useState(0)
  const ref = (api) => {
    if (api) setCount(api.visibleNodes.length)
  }
  return { ref, count }
}

export default function Layers({ layers = [] }) {
  const { count, ref } = useTreeVisibleNodesCount();

  return (
    <div className="layers">
      <div>
        <h5>Kartlag</h5>
      </div>
      <Tree
        initialData={layers}
        disableEdit
        disableDrag
        disableDrop
        disableMultiSelection
        openByDefault={false}
        height={count * ROW_HEIGHT}
        indent={10}
        width={400}
        rowHeight={ROW_HEIGHT}
        overscanCount={1}
        ref={ref}
      >
        {Child}
      </Tree>
    </div>
  )
}