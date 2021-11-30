import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  AlertController,
  IonRouterOutlet,
  LoadingController,
  ModalController,
  NavController,
  Platform,
  ToastController,
} from "@ionic/angular";
import { CheckoutService } from "src/app/services/checkout/checkout.service";
import { OrderService } from "src/app/services/order/order.service";
import { CouponPage } from "../coupon/coupon.page";
import { ModeofpaymentPage } from "../modeofpayment/modeofpayment.page";
import { PaytabsService } from "src/app/services/paytabs.service";
import { WalletService } from "src/app/services/wallet/wallet.service";
import { AuthenticationService } from "src/app/services/authentication.service";
import { Storage } from "@ionic/storage";
import { PaymentService } from "src/app/services/payment/payment.service";
import { UtilsService } from "src/app/services/utils.service";
import { SuccessfulPage } from "../successful/successful.page";


const GET_AMOUNTDETAILS = 200;
const ORDER_RESPONSE = 210;
const GET_PAY = 220;
const WALLET_RESPONSE = 230;
const POST_DATA = 240;
const CONFIRM = 250;

@Component({
  selector: "app-checkout",
  templateUrl: "./checkout.page.html",
  styleUrls: ["./checkout.page.scss"],
})
export class CheckoutPage implements OnInit {
  address_id: any;
  data: any;
  promo_id: any;
  payment_id: any;
  discount_amount: number = 0;
  delivery_location_id: any;
  client_id: any;
  response: any;
  appUrl: string;
  payable_order_id: any;
  current_platform: any;
  is_cardOrNetBanking:boolean=false
  private subscription: any;

  constructor(
    private checkoutService: CheckoutService,
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private platform: Platform,
    private router: Router,
    private paytabService: PaytabsService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private walletService: WalletService,
    private alertController: AlertController,
    private authservice: AuthenticationService,
    private storage: Storage,
    private pay: PaymentService,
    private utils: UtilsService,
    private paymentService: PaymentService,
    private navController:NavController
  ) {
    // console.log('b4', window.history)
    this.appUrl = this.utils.getAppUrl();
    this.address_id = this.activatedRoute.snapshot.params.address_id;
    this.delivery_location_id = this.activatedRoute.snapshot.params.delivery_location_id;
    if (this.platform.is("cordova")) {
      this.current_platform = "cordova";
    } else if (this.platform.is("pwa")) {
      this.current_platform = "pwa";
    } else {
      this.current_platform = "web";
    }
    
  }

  ionViewWillEnter() {
    this.promo_id = null;
    this.discount_amount = 0;
  }

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.presentLoading().then(() => {
      this.authservice.isAuthenticated().then((val) => {
        if (val) {
          this.client_id = val;
          this.checkoutService
            .getAmountDetails(val, this.address_id, this.delivery_location_id)
            .subscribe(
              (data) => this.handleResponse(data, GET_AMOUNTDETAILS),
              (error) => this.handleError(error, GET_AMOUNTDETAILS)
            );
        }
      });
    });
  } 

  handleResponse(data, type) {
    if (type == GET_AMOUNTDETAILS) {
      this.loadingController.dismiss();

      this.data = data;
    } else if (type == GET_PAY) {

    } 
    else if (type == ORDER_RESPONSE) {
      this.loadingController.dismiss();
      this.payable_order_id = data.payable_order_id;
      // let storable_data = {
      //   payable_order_id: data.payable_order_id,
      //   payable_amount: this.data.payable_amount,
      // };
      // this.storage.set("data_store", JSON.stringify(storable_data)).then(() => { });
      if (this.payment_id == 4) {
        // this.router.navigate(["paypal"]);
        this.hostedSubmit();
      } else if (this.payment_id == 2) {
        this.presentSuccessModal()  
      }
    } 
    else if (type == WALLET_RESPONSE) {
   
      this.loadingController.dismiss();
      this.presentSuccessModal()  
    } 
    else if (type == POST_DATA) {
      this.is_cardOrNetBanking = true
      this.response = data;
      this.storage.set("tran_ref", data.tran_ref).then(() => {
        let encodedData = {
          redirect_url: encodeURIComponent(data.redirect_url),
          tran_ref: data.tran_ref,
          client_id: this.client_id,
          incoming_platform: this.current_platform,
        };

        var url = `${this.appUrl}iframe?data=${JSON.stringify(encodedData)}`;
        window.open(url, "_self");
        if (this.platform.is("cordova")) {
          this.subscription = this.platform.resume.subscribe(async () => {
            this.storage.get("tran_ref").then((ref) => {
              if (ref) {
                this.paymentService
                  .confirmPayment(ref, this.client_id)
                  .subscribe(
                    (data) => this.handleResponse(data, CONFIRM),
                    (error) => this.handleError(error, CONFIRM)
                  );
              }
            });
          });
        }
      });
      this.loadingController.dismiss();
    } else if (type == CONFIRM) {
      if (data.details) {
        if (data.details.response_status == "A") {
          this.router.navigate(["/tabs/home"], { replaceUrl: true });
        } else {
          this.router.navigate(["/tabs/cart"], { replaceUrl: true });
        }
      } else {
        alert("Payment Cancelled.");
      }
    }
  }

  handleError(error, type) {
    this.loadingController.dismiss();

    if (type == WALLET_RESPONSE) {
      if (error.status == 400) {
        if (error.error.wallet_status) {
          this.presentAlertConfirmWallet();
        } else {
          let msg = "Wallet recharge currently not available.";
          this.presentToast(msg);
        }
      }
      if (error.status == 500) {
        this.qtyNotSufficient(error.error.message);
      }
    }
    else{
      this.presentToast(error.error.message);
    }
  }

  checkOut() {
    this.openPaymentModes();
  }

  hostedSubmit() {
    this.presentLoading().then(() => {
      let data = {
        client_id: JSON.stringify(this.client_id),
        payable_order_id: JSON.stringify(this.payable_order_id),
        payable_amount: JSON.stringify(this.data.payable_amount),
        address_id: this.address_id,
      };

      this.pay.hostedPay(data).subscribe(
        (data) => this.handleResponse(data, POST_DATA),
        (error) => this.handleError(error, POST_DATA)
      );
    });
  }

  async openPromo() {
    const modal = await this.modalController.create({
      component: CouponPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      cssClass: "my-custom-class",
      componentProps: { totalAmount: this.data.total_amount },
    });
    modal.onDidDismiss().then((data) => {
      const promo_Details = data["data"];
      if (promo_Details) {
        this.data.payable_amount -= promo_Details.discount_amount;
        this.discount_amount = promo_Details.discount_amount;
        this.promo_id = promo_Details.promo_Id;
      }
    });
    return await modal.present();
  }

  removePromo() {
    this.data.payable_amount += this.discount_amount;
    this.discount_amount = 0;

    this.discount_amount = 0;
    this.promo_id = null;
  }

  async openPaymentModes() {

    const modal = await this.modalController.create({
      component: ModeofpaymentPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      cssClass: "paymentOptions",
      backdropDismiss: true,
    });
    modal.onDidDismiss().then((data) => {
      const paymentDetails = data["data"];
      if (paymentDetails) {
        this.presentLoading().then(() => {
          this.payment_id = paymentDetails.modeOfPayment_Id;
          
          if (this.payment_id == 7) {
            this.authservice.isAuthenticated().then((val) => {
              if (val) {
                let data = {
                  client_id: val,
                  promo_code_id: this.promo_id,
                  address_id: this.address_id,
                  payment_option_id: this.payment_id,
                  product_total: this.data.total_amount,
                  payable_amount: Math.round(this.data.payable_amount),
                  delivery_charge: this.data.delivery_charge,
                };

                this.walletService.captureWallet(data).subscribe(
                  (data) => this.handleResponse(data, WALLET_RESPONSE),
                  (error) => this.handleError(error, WALLET_RESPONSE)
                );
              }
            });
          } else {
            this.authservice.isAuthenticated().then((val) => {
              if (val) {
                let data = {
                  client_id: val,
                  promo_code_id: this.promo_id,
                  address_id: this.address_id,
                  payment_option_id: this.payment_id,
                  product_total: this.data.total_amount,
                  payable_amount: this.data.payable_amount,
                  delivery_charge: this.data.delivery_charge,
                };
                this.orderService.captureOrder(data).subscribe(
                  (data) => this.handleResponse(data, ORDER_RESPONSE),
                  (error) => this.handleError(error, ORDER_RESPONSE)
                );
              }
            });
          }


        });

      }
    });
    return await modal.present();
  }

  async presentSuccessModal() {
    const modal = await this.modalController.create({
      component: SuccessfulPage,
      cssClass: 'my-custom-class'
    });

    modal.onDidDismiss().then(()=>{
      this.router.navigate(['/tabs/home'], { replaceUrl: true });
      // this.navController.navigateRoot('tabs/home')
    })
    return await modal.present();
  }

  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      cssClass: "custom-toast",
      position: "top",
      color: "dark",
      duration: 2000,
    });
    toast.present();
  }

  async presentAlertConfirmWallet() {
    const alert = await this.alertController.create({
      cssClass: "my-custom-class",
      header: "Insufficient Wallet Balance",
      message: "Recharge your Wallet",
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
          cssClass: "secondary",
          handler: () => {},
        },
        {
          text: "Okay",
          handler: () => {
            let balance = this.data.payable_amount - this.data.wallet_balance;
            this.router.navigate(["recharge", { balance }]);
          },
        },
      ],
    });

    await alert.present();
  }

  async qtyNotSufficient(msg) {
    const alert = await this.alertController.create({
      cssClass: "my-custom-class",
      header: "Error",
      message: msg,
      buttons: [
        {
          text: "Okay",
          handler: () => {
            this.router.navigate(["/tabs/cart"]);
          },
        },
      ],
    });

    await alert.present();
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      spinner: "crescent",
      cssClass: "custom-spinner",
      message: "Please wait...",
      showBackdrop: true,
    });
    await loading.present();
  }

  ngOnDestroy(): void {
    if ((this.platform.is("cordova")) && this.is_cardOrNetBanking) {
      this.subscription.unsubscribe();
    }
    
  }
}
