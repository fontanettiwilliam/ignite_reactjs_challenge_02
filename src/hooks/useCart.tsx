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

  const successAddProduct = (newCart: Product[]) => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    setCart(newCart);
    toast.success("Produto adicionado ao carrinho!");
  };

  const stockInsufficientMessage = () => {
    toast.error("Quantidade solicitada fora de estoque");
  };

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];

      const responseStock = await api.get(`stock?id=${productId}`);
      const stockProduct: Stock = responseStock.data[0];

      if (!stockProduct) {
        toast.error("Produto não encontrado no estoque");
        return;
      }

      const findIndexProduct = cart.findIndex((item) => item.id === productId);

      if (findIndexProduct !== -1) {
        newCart[findIndexProduct].amount += 1;

        if (stockProduct.amount < newCart[findIndexProduct].amount) {
          stockInsufficientMessage();
          return;
        }
        successAddProduct(newCart);
        return;
      }

      const responseProduct = await api.get(`products?id=${productId}`);
      const product: Product = responseProduct.data[0];
      product.amount = 1;

      if (stockProduct.amount < product.amount) {
        stockInsufficientMessage();
        return;
      }

      newCart.push(product);
      successAddProduct(newCart);

      return;
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
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
