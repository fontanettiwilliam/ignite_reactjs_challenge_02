import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const successAddProduct = async (newCart: Product[]) => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    setCart(newCart);
    toast.success("Produto adicionado ao carrinho!");
    return;
  };

  const stockInsufficientMessage = async () => {
    toast.error("Quantidade solicitada fora de estoque");
    return;
  };

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const findIndexProduct = newCart.findIndex(
        (item) => item.id === productId
      );

      const responseStock = await api.get(`stock/${productId}`);
      const stockProduct: Stock = responseStock.data;

      if (!stockProduct) {
        stockInsufficientMessage();
        return;
      }

      const currentAmount =
        findIndexProduct !== -1 ? newCart[findIndexProduct].amount : 0;
      const amount = currentAmount + 1;

      if (stockProduct.amount < amount) {
        stockInsufficientMessage();
        return;
      }

      if (findIndexProduct !== -1) {
        newCart[findIndexProduct].amount += 1;
        successAddProduct(newCart);
        return;
      }

      const responseProduct = await api.get(`products/${productId}`);
      const product: Product = responseProduct.data;

      if (!product) {
        toast.error("Erro na adição do produto");
        return;
      }

      if (stockProduct.amount < (product.amount || 0) + 1) {
        stockInsufficientMessage();
        return;
      }

      product.amount = 1;
      newCart.push(product);
      successAddProduct(newCart);

      return;
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const findIndexProduct = newCart.findIndex(
        (item) => item.id === productId
      );

      if (findIndexProduct !== -1) {
        newCart.splice(findIndexProduct, 1);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        setCart(newCart);
        toast.success("Produto removido do carrinho!");
        return;
      }

      toast.error("Erro na remoção do produto");
      return;
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const newCart = [...cart];

      const responseStock = await api.get(`stock/${productId}`);
      const stockProduct: Stock = responseStock.data;

      if (!stockProduct) {
        stockInsufficientMessage();
        return;
      }

      const findIndexProduct = newCart.findIndex(
        (item) => item.id === productId
      );

      if (stockProduct.amount < amount) {
        stockInsufficientMessage();
        return;
      }

      if (findIndexProduct !== -1) {
        newCart[findIndexProduct].amount = amount;
        successAddProduct(newCart);
        return;
      }

      toast.error("Erro na alteração de quantidade do produto");
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
