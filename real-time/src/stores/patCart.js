// NOTE: A PurpleAirTimeseries shopping cart based on:
// NOTE:   https://medium.com/@dkthelearner/implementing-a-shopping-cart-functionality-with-svelte-ec700b348251

import { writable } from "svelte/store";

const initialState = {
  items: [],
  total: 0,
};

function createCart() {
  const { subscribe, set, update } = writable(initialState);
  return {
    subscribe,
    addItem: (productId) =>
      update((state) => {
        const product = { id: productId, csv: "abcd", price: 10.99 };
        const index = state.items.findIndex((item) => item.id === product.id);
        if (index !== -1) {
          state.items[index].quantity += 1;
        } else {
          state.items.push({ ...product, quantity: 1 });
        }
        state.total += product.price;
        return state;
      }),
    removeItem: (productId) =>
      update((state) => {
        const index = state.items.findIndex((item) => item.id === productId);
        if (index !== -1) {
          state.total -= state.items[index].price * state.items[index].quantity;
          state.items.splice(index, 1);
        }
        return state;
      }),
    clear: () => set(initialState),
  };
}
export const patCart = createCart();
