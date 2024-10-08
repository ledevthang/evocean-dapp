'use client';

import { PaymentParams } from '@/models/scrypto-price.type';
import { RootState } from '@/store/slices';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

const type = {};

const DetailThemePagePayment = () => {
  const router = useRouter();
  const { id, currencyCode, walletAddress, amount } =
    useParams<PaymentParams>();
  const { accountInfo } = useSelector((state: RootState) => state.auth);

  const themeData = {
    theme_id: +id,
    currency: 'usd'
  };

  const MoonPayProvider = dynamic(
    () => import('@moonpay/moonpay-react').then(mod => mod.MoonPayProvider),
    { ssr: false }
  );

  const MoonPayBuyWidget = dynamic(
    () => import('@moonpay/moonpay-react').then(mod => mod.MoonPayBuyWidget),
    { ssr: false }
  );

  const handleBuy = () => {
    router.push(
      `${process.env.NEXT_PUBLIC_API_URL}?apiKey=${process.env.NEXT_PUBLIC_PUBLIC_KEY_MOONPAY}&currencyCode=eth&walletAddress=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae`,
      { scroll: false }
    );
  };

  const handleGetSignature = async (url: string): Promise<string> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/themes/payment?url=${url}`
    );
    const result = await response.json();
    return result.signature as string;
  };

  return (
    <div className="min-h-[500px] mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 pt-16 flex justify-center">
      <MoonPayProvider
        apiKey={process.env.NEXT_PUBLIC_PUBLIC_KEY_MOONPAY ?? ''}
        debug
      >
        <div className="App">
          <MoonPayBuyWidget
            variant="embedded"
            baseCurrencyCode="usd"
            baseCurrencyAmount={amount || ''}
            defaultCurrencyCode={currencyCode || ''}
            walletAddress={'0x157B17a4a0829E5E6F9b892Fd8f0c647d05eD6Aa'}
            // visible={visible}
            visible
            // onUrlSignatureRequested={handleGetSignature}
            theme="dark"
            externalCustomerId={accountInfo?.id.toString()}
            externalTransactionId={JSON.stringify(themeData)}
            redirectURL={`/detail/${id}`}
          />
        </div>
      </MoonPayProvider>
    </div>
  );
};

export default DetailThemePagePayment;
