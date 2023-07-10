const configs = {
  width: 1000,
  height: 565,
  size: 20,
  speed: 5,
  tickRate: 15,
  border: false, // if border === true, snake will die if it hits border
  exact: false, // if exact === true, snake only eats food when it head coordinate exactly === food coordinate, otherwise it can eat food when its head touch a part of the food
};

export default configs;
