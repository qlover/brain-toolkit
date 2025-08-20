import { ViewMapBaseProvider } from '../implemention/ViewMapBaseProvider';

enum CardNames {
  Idea = 'Idea',
  IdeaGift = 'IdeaGift',
  IdeaDish = 'IdeaDish',
  Flight = 'Flight',
  FlightsCard = 'FlightsCard',
  Hotel = 'Hotel'
}

interface ViewProps {
  type: CardNames;
}

const provider = new ViewMapBaseProvider<CardNames, ViewProps>();

export function ViewMap() {
  const type = CardNames.Flight;

  const { Component, props } = provider.getElement(type)!;

  return <Component type={type} {...props} />;
}
