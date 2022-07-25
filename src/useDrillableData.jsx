import { useReducer } from "react";

export const useDrillableData = (data) => {
  const initialState = {
    stack: [],
    startAngle: 0,
    endAngle: 0,
  };

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "drilldown":
        return {
          drillID: action.data.id,
          startAngle: action.startAngle,
          endAngle: action.endAngle,
        };
      case "drillup":
        return {};

      default:
        return state;
    }
  }, initialState);

  return [state, dispatch];
};
