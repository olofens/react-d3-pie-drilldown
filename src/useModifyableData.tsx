import { useCallback, useState } from "react";
//@ts-ignore
import chroma from "chroma-js";

export const marketNames = [
  "coinbase",
  "kraken",
  "binance",
  "ftx",
  "bitmex",
  "huobi",
  "dvchain",
  "fireblocks",
  "copper",
];
const coins = [
  {
    name: "BTC",
    color: "orange",
    value: 100,
  },
  {
    name: "ETH",
    color: "gray",
    value: 80,
  },
  {
    name: "AVAX",
    color: "red",
    value: 60,
  },
  {
    name: "LINK",
    color: "blue",
    value: 60,
  },
  {
    name: "MATIC",
    color: "purple",
    value: 50,
  },
  {
    name: "BSV",
    color: "yellow",
    value: 10,
  },
  {
    name: "SOL",
    color: "teal",
    value: 30,
  },
];

const coinNames = coins.map((coin) => coin.name);

const marketDataPoints = marketNames.map((marketName, marketIndex) => {
  const sum = coins.reduce((total, coin) => (total += coin.value), 0);
  return {
    name: marketName,
    id: marketName,
    level: 0,
    index: marketIndex,
    color: chroma("blue")
      .brighten(marketIndex * 0.15)
      .hex(),
    value: sum,
    children: [...coins].map((coin, coinIndex) => ({
      ...coin,
      level: 1,
      prevIndex: marketIndex,
      id: `${coin.name}-${marketIndex}-${coinIndex}`,
    })),
  };
});

export const initData = marketDataPoints;

export const useModifyableData = () => {
  const [data, setData] = useState(initData);

  const changeValue = useCallback(
    (modMarketName: string, modCoinName: string, delta: number) => {
      setData((currData) => {
        return currData.map((market) => {
          return market.name !== modMarketName
            ? market
            : {
                ...market,
                value: market.value + delta,
                children: market.children.map((coin) =>
                  coin.name !== modCoinName
                    ? coin
                    : { ...coin, value: coin.value + delta }
                ),
              };
        });
      });
    },
    []
  );

  const addMarket = useCallback(() => {
    setData((currData) => {
      const n = currData.length;
      const newName = "new" + n;
      const newIndex = n;

      const newMarket = {
        ...marketDataPoints[0],
        name: newName,
        id: newName,
        index: newIndex,
      };

      return [...currData, newMarket];
    });
  }, []);

  const addCoin = useCallback((marketModName: string) => {
    console.log("adding");
    setData((currData) => {
      const nMarketCoins = currData.find(
        (market) => market.name === marketModName
      )?.children.length;
      const coinToCopy = marketDataPoints[0].children[0];
      const newCoin = {
        ...coinToCopy,
        name: coinToCopy.name + nMarketCoins,
        id: coinToCopy.id + nMarketCoins,
      };
      return currData.map((market) =>
        market.name !== marketModName
          ? market
          : {
              ...market,
              value: market.value + newCoin.value,
              children: [...market.children, newCoin],
            }
      );
    });
  }, []);

  return {
    data,
    changeValue,
    addMarket,
    addCoin,
  };
};
