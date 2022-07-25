import React, { useState } from "react";
import "./App.css";
import { PieDrilldown } from "./PieDrilldown";
import * as d3 from "d3";
import chroma from "chroma-js";
import { marketNames, useModifyableData } from "./useModifyableData";
import { PieDrilldown2 } from "./PieDrilldown2";
import { PieDrilldown3 } from "./PieDrilldown3";
const { faker } = require("@faker-js/faker");

function generateData(level, prevIndex, color) {
  const N = d3.randomUniform(3, 10)();
  const colors = color
    ? d3.range(N).map((i) =>
        chroma(color)
          .brighten(i * 0.1)
          .hex()
      )
    : d3.schemePaired;

  return d3.range(N).map((i) => ({
    value: Math.abs(d3.randomNormal()()),
    id: `myid${level}x${i}`,
    level: level,
    index: i,
    prevIndex: prevIndex,
    name: faker.internet.userName(),
    color: colors[i],
    children: level > 0 ? generateData(level - 1, i, colors[i]) : [],
  }));
}

function App() {
  const { data, addMarket, addCoin } = useModifyableData();
  const [market, setMarket] = useState(undefined);

  return (
    <div className="App">
      <h1>Drilldown piechart in React & D3</h1>
      <svg width="500" height="300">
        <PieDrilldown key={"chart"} data={data} x={250} y={150} />
      </svg>
      <PieDrilldown2 key={"chart2"} data={data} x={250} y={150} />
      <PieDrilldown3 key={"chart3"} data={data} x={250} y={150} />

      <button onClick={addMarket}>Add market</button>
      <div>
        <select value={market} onChange={(e) => setMarket(e.target.value)}>
          <option value={undefined} />
          {marketNames.map((marketName) => (
            <option key={marketName} value={marketName}>
              {marketName}
            </option>
          ))}
        </select>
        <button onClick={() => market && addCoin(market)}>Add coin</button>
      </div>
    </div>
  );
}

export default App;
