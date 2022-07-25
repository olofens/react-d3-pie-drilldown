import React, { useState, useEffect, useReducer, useRef } from "react";
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

export const PieDrilldown2 = ({ data, x, y }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const arcGenerator = d3.arc().innerRadius(80).outerRadius(100);

    const pieGenerator = d3.pie().value((d) => d.value);
    const instructions = pieGenerator(data);

    svg
      .selectAll(".rootSlice")
      .data(instructions)
      .join("path")
      .attr("class", "rootSlice")
      .attr("stroke", "black")
      .attr("fill", "white")
      .attr("transform", `translate(${x}, ${y})`)
      .transition()
      .attrTween("d", function (nextInstruction) {
        const interpolator = d3.interpolate(
          this.lastInstruction,
          nextInstruction
        );
        this.lastInstruction = interpolator(1);
        return function (t) {
          return arcGenerator(nextInstruction);
        };
      })
      .attr("d", (instruction) => arcGenerator(instruction));
  }, [data]);

  return <svg ref={svgRef} width="500" height="300" />;
};
