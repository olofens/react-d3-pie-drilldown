import React, { useEffect, useReducer, useRef, useState } from "react";
import { animated, useSpring } from "react-spring";
import * as d3 from "d3";
import styled from "styled-components";
import { useDrillableData } from "./useDrillableData";

const Path = styled.path`
  fill: ${(props) => props.color};
  stroke: black;
`;

const colors = d3.scaleOrdinal(d3.schemeCategory10);
const format = d3.format(".2f");
const ANIMATION_DURATION = 1500;
const animationConfig = {
  to: async (next, cancel) => {
    await next({ t: 1 });
  },
  from: { t: 0 },
  config: { duration: ANIMATION_DURATION },
  reset: true,
};

const addRadius = 8;

const defaultRadii = {
  insideInnerRadius: 80,
  insideOuterRadius: 115,
  outsideOuterRadius: 115,
};

const hoveredRadii = {
  insideInnerRadius: defaultRadii.insideInnerRadius - addRadius / 2,
  insideOuterRadius: defaultRadii.insideOuterRadius + addRadius,
  outsideOuterRadius: defaultRadii.insideOuterRadius + addRadius * 2,
};

const drilledIntoRadii = {
  insideInnerRadius: defaultRadii.insideInnerRadius,
  insideOuterRadius: defaultRadii.insideInnerRadius,
  outsideOuterRadius: defaultRadii.insideOuterRadius,
};

const OuterArc = ({
  index,
  fromData,
  toData,
  animatedProps,
  outerArcGenerator,
}) => {
  if (fromData === undefined) {
    fromData = {
      ...toData,
      startAngle: toData.endAngle,
    };
  }

  const interpolator = d3.interpolate(fromData, toData);

  return (
    <Path
      as={animated.path}
      className="2arc"
      d={animatedProps.t.interpolate((t) => outerArcGenerator(interpolator(t)))}
      stroke="black"
      color={toData.data.color}
    />
  );
};

const outerPieGenerator = d3.pie().value((d) => d.value);

const Arc = ({
  index,
  fromData,
  toData,
  colors,
  format,
  animatedProps,
  firstRender,
  onClick,
  drillID,
}) => {
  if (fromData === undefined && !firstRender) {
    fromData = {
      ...toData,
      startAngle: toData.endAngle,
    };
  }

  const clickable = toData.data.children != null;
  const [hovering, setHovering] = useState(false);
  const [radii, setRadii] = useState(defaultRadii);
  const { insideInnerRadius, insideOuterRadius, outsideOuterRadius } = radii;

  const [pieAngles, setPieAngles] = useState({
    startAngle: toData.startAngle,
    endAngle: toData.endAngle,
  });
  const { startAngle, endAngle } = pieAngles;

  const interpolator = d3.interpolate(fromData, toData);

  const innerArcGenerator = d3
    .arc()
    .innerRadius(insideInnerRadius)
    .outerRadius(insideOuterRadius);

  const newOuterPieData = useRef([]);
  const prevOuterPieData = useRef([]);
  // whenever either of these dp changes we set our outer pie caches
  useEffect(() => {
    newOuterPieData.current = outerPieGenerator
      .startAngle(toData.startAngle)
      .endAngle(toData.endAngle)(toData.data.children);
    if (fromData) {
      prevOuterPieData.current = outerPieGenerator
        .startAngle(fromData.startAngle)
        .endAngle(fromData.endAngle)(fromData.data.children);
    }
  }, [fromData, toData]);

  //   const previousData = outerPieDataCache.current;

  //   useEffect(() => {
  //     outerPieDataCache.current = outerPieData;
  //   }, [outerPieData]);

  const outerArcGenerator = d3
    .arc()
    .innerRadius(insideOuterRadius)
    .outerRadius(outsideOuterRadius);

  function mouseOver() {
    setHovering(clickable && true);
  }

  function mouseOut() {
    setHovering(false);
  }

  if (drillID && hovering) {
    setHovering(false);
  }

  useEffect(() => {
    if (drillID) return;
    const sel = d3.select("#" + toData.data.id);

    sel
      .transition(`slice-hover-${toData.data.id}`)
      .duration(ANIMATION_DURATION)
      .tween(`amountEnlarged-${toData.data.id}`, function () {
        const interpolator = hovering
          ? d3.interpolateObject(radii, hoveredRadii)
          : d3.interpolateObject(radii, defaultRadii);

        return (t) => setRadii({ ...interpolator(t) });
      });
  }, [hovering]);

  useEffect(() => {
    const drilledInto = drillID === toData.data.id;
    const sel = d3.select("#" + toData.data.id);

    sel
      .transition(`slice-expand-${toData.data.id}`)
      .duration(ANIMATION_DURATION)
      .tween(`slice-expand-${toData.data.id}`, function () {
        const interpolator = drilledInto
          ? d3.interpolateObject(radii, drilledIntoRadii)
          : d3.interpolateObject(radii, defaultRadii);

        return (t) => setRadii({ ...interpolator(t) });
      });

    d3.selection()
      .transition(`outer-pie-expand-${toData.data.id}`)
      .duration(ANIMATION_DURATION)
      .tween(`slice-expand-${toData.data.id}`, function () {
        const interpolator = d3.interpolateObject(pieAngles, {
          startAngle: toData.startAngle,
          endAngle: toData.endAngle,
        });

        return (t) => setPieAngles({ ...interpolator(t) });
      });
  }, [drillID]);

  return (
    <g key={index} className="arc">
      <Path
        as={animated.path}
        className="arc"
        d={animatedProps.t.interpolate((t) =>
          innerArcGenerator(interpolator(t))
        )}
        onMouseOver={mouseOver}
        onMouseOut={mouseOut}
        stroke="black"
        onClick={() => clickable && onClick()}
        color={toData.data.color}
        cursor={clickable ? "pointer" : "cursor"}
      />
      {/* <animated.text
        transform={animatedProps.t.interpolate(
          (t) => `translate(${innerArcGenerator.centroid(interpolator(t))})`
        )}
        textAnchor="middle"
        alignmentBaseline="middle"
        fill="white"
        fontSize="10"
        pointerEvents="none"
      >
        {animatedProps.t.interpolate((t) => format(interpolator(t).value))}
      </animated.text> */}
      <g>
        {newOuterPieData.current &&
          (drillID === toData.data.id || hovering) &&
          newOuterPieData.current.map((outerArcData, i) => {
            return (
              //   <Path
              //     as={animated.path}
              //     key={outerArcData.data.id}
              //     id={outerArcData.data.id}
              //     d={outerArcGenerator(outerArcData)}
              //     color={outerArcData.data.color}
              //   />
              <OuterArc
                key={outerArcData.data.id}
                index={i}
                firstRender={prevOuterPieData.current.length === 0}
                fromData={prevOuterPieData.current[i]}
                toData={outerArcData}
                animatedProps={animatedProps}
                outerArcGenerator={outerArcGenerator}
              />
            );
          })}
      </g>
    </g>
  );
};

export const PieDrilldown3 = ({ data, x, y }) => {
  const [{ drillID, startAngle, endAngle }, dispatch] = useDrillableData(data);

  const cache = useRef([]);
  const pieGenerator = d3
    .pie()
    .value((d) => d.value)
    .sort(null);

  const pieData = pieGenerator(data);
  const previousData = cache.current;

  const [animatedProps, setAnimatedProps] = useSpring(() => animationConfig);
  setAnimatedProps(animationConfig);

  let transformedPieData = pieData;
  if (drillID) {
    // get the startAngle and endAngle of the selected slice we're gonna drill into
    const { startAngle, endAngle } = pieData.find(
      (slice) => slice.data.id === drillID
    );

    const sliceSize = endAngle - startAngle;
    const halfSlice = sliceSize / 2;

    const center = startAngle + halfSlice;
    const oppositeCenter = center + Math.PI;

    const newPieData = pieData.map((slice) => {
      if (slice.data.id === drillID) {
        return {
          ...slice,
          startAngle: slice.startAngle - Math.PI + halfSlice,
          endAngle: slice.endAngle + Math.PI - halfSlice, // loop it all the way around
        };
      } else {
        const myCenter =
          slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
        const zeroAngle =
          myCenter > center ? oppositeCenter : oppositeCenter - Math.PI * 2;
        return {
          ...slice,
          startAngle: zeroAngle,
          endAngle: zeroAngle,
        };
      }
    });

    transformedPieData = newPieData;
  }

  useEffect(() => {
    cache.current = transformedPieData;
  }, [transformedPieData]);

  function drilldown(d) {
    dispatch({ type: "drilldown", ...d });
  }

  function drillup() {
    dispatch({ type: "drillup" });
  }

  return (
    <svg width="500" height="300">
      <g transform={`translate(${x}, ${y})`}>
        {transformedPieData.map((d, i) => (
          <Arc
            key={d.data.id}
            index={i}
            firstRender={cache.current.length === 0}
            fromData={previousData[i]}
            toData={d}
            format={format}
            animatedProps={animatedProps}
            onClick={() => drilldown(d)}
            drillID={drillID}
          />
        ))}
        <circle cx={0} cy={0} r={15} fill="black" onClick={drillup} />
      </g>
    </svg>
  );
};
