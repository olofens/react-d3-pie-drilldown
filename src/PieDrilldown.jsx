import React, { useState, useEffect, useReducer } from "react";
import * as d3 from "d3";
import styled from "styled-components";

const Path = styled.path`
  fill: ${(props) => props.color};
  cursor: ${({ clickable }) => (clickable ? "pointer" : "cursor")};
  stroke: black;
`;

const Arc = ({ arcData, onClick }) => {
  const clickable = arcData.data.children != null;

  const [hovering, setHovering] = useState(false);
  const [radiusAdd, setRadiusAdd] = useState(0);

  const insideInnerRadius = 80 - radiusAdd / 2;
  const insideOuterRadius = 105 + radiusAdd;

  const arcGenerator = d3
    .arc()
    .innerRadius(insideInnerRadius)
    .outerRadius(insideOuterRadius);

  const outerPie = d3
    .pie()
    .startAngle(arcData.startAngle)
    .endAngle(arcData.endAngle)
    .value((d) => d.value);

  const outerArcGenerator = d3
    .arc()
    .innerRadius(insideOuterRadius)
    .outerRadius(insideOuterRadius + radiusAdd);

  function mouseOver() {
    setHovering(clickable && true);
  }

  function mouseOut() {
    setHovering(clickable && false);
  }

  useEffect(() => {
    const sel = d3.select("#" + arcData.data.id);

    sel
      .transition(`slice-hover-${arcData.data.id}`)
      .duration(500)
      .ease(d3.easeCubicInOut)
      .tween(`amountEnlarged-${arcData.data.id}`, function () {
        const interpolator = hovering
          ? d3.interpolate(radiusAdd, 8)
          : d3.interpolate(radiusAdd, 0);

        return (t) => setRadiusAdd(interpolator(t));
      });
  }, [hovering]);

  return (
    <g>
      <Path
        id={arcData.data.id}
        d={arcGenerator(arcData)}
        color={arcData.data.color}
        onMouseOver={mouseOver}
        onMouseOut={mouseOut}
        clickable={clickable}
        onClick={() => clickable && onClick(arcData)}
      />
      <g>
        {arcData.data.children &&
          outerPie(arcData.data.children).map((outerArcData) => {
            return (
              <Path
                key={outerArcData.data.id}
                id={outerArcData.data.id}
                d={outerArcGenerator(outerArcData)}
                color={outerArcData.data.color}
              />
            );
          })}
      </g>
    </g>
  );
};

function useDrillableData(data) {
  const initialState = {
    renderData: data,
    stack: [],
    startAngle: 0,
  };

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "data-update":
        return {
          ...state,
          renderData: action.data,
        };
      case "drilldown":
        return {
          renderData: state.renderData[action.index].children,
          stack: [...state.stack, state.renderData],
          startAngle: action.startAngle,
        };
      case "drillup":
        if (state.stack.length > 0) {
          return {
            renderData: state.stack.slice(-1)[0],
            stack: state.stack.slice(0, -1),
            startAngle: state.startAngle,
          };
        } else {
          return state;
        }
      default:
        return state;
    }
  }, initialState);

  useEffect(() => {
    dispatch({ type: "data-update", data });
  }, [data]);

  return [state, dispatch];
}

export const PieDrilldown = ({ data, x, y }) => {
  const [{ renderData, startAngle }, dispatch] = useDrillableData(data);
  const [percentVisible, setPercentVisible] = useState(0);

  const pie = d3
    .pie()
    .startAngle(startAngle)
    .endAngle(startAngle + percentVisible * Math.PI * 2)
    .value((d) => d.value);

  function drilldown({ startAngle, index }) {
    dispatch({ type: "drilldown", index, startAngle });
  }

  function drillup() {
    dispatch({ type: "drillup" });
  }

  useEffect(() => {
    const sel = d3.selection();

    sel
      .transition("pie-reveal")
      .duration(8000)
      .ease(d3.easeSinInOut)
      .tween("percentVisible", () => {
        const percentInterpolate = d3.interpolate(0, 100);
        return (t) => setPercentVisible(percentInterpolate(t));
      });
  }, [renderData]);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {pie(renderData).map((d) => {
        return <Arc arcData={d} key={d.data.id} onClick={drilldown} />;
      })}
      <circle cx={0} cy={0} r={15} fill="black" onClick={drillup} />
    </g>
  );
};
