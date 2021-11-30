import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LoadingController, Platform, ToastController } from "@ionic/angular";
import { PaymentService } from "src/app/services/payment/payment.service";
import { InAppBrowser } from "@ionic-native/in-app-browser/ngx";
import { Storage } from "@ionic/storage";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AuthenticationService } from "src/app/services/authentication.service";
import { UtilsService } from "src/app/services/utils.service";
const CONFIRM = 345;
const POST_DATA = 600;
@Component({
  selector: "app-recharge",
  templateUrl: "./recharge.page.html",
  styleUrls: ["./recharge.page.scss"],
})
export class RechargePage implements OnInit {
  public rechargeForm: FormGroup;
  client_id: any;
  subscription: any;
  appUrl: string;
  current_platform: any;
  is_walletRecharge: boolean = false;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loadingController: LoadingController,
    private storage: Storage,
    private platform: Platform,
    private iab: InAppBrowser,
    private utils: UtilsService,
    private pay: PaymentService,
    private toastController: ToastController,
    private formBuilder: FormBuilder,
    private authservice: AuthenticationService,
    private paymentService: PaymentService,

  ) {
    this.appUrl = this.utils.getAppUrl();
    if (this.platform.is("cordova")) {
      this.current_platform = "cordova";
    } else if (this.platform.is("pwa")) {
      this.current_platform = "pwa";
    } else {
      this.current_platform = "web";
    }
    this.rechargeForm = this.formBuilder.group({
      client_id: [""],
      amount: [
        "",
        Validators.compose([Validators.required, Validators.pattern("[0-9]*.[0-9]*")]),
      ],
    });

    this.authservice.isAuthenticated().then((val) => {
      if (val) {
        this.client_id = JSON.stringify(val);
        this.rechargeForm.controls["client_id"].setValue(this.client_id);
      }
    });

    let amount = this.activatedRoute.snapshot.params.balance;
    if (amount) {
      this.rechargeForm.controls["amount"].setValue(amount);
    }
  }

  ngOnInit() {}

  recharge() {
    this.presentLoading().then(() => {
      this.pay.wallet_hostedPay(this.rechargeForm.value).subscribe(
        (data) => this.handleResponse(data, POST_DATA),
        (error) => this.handleError(error)
      );
    });
  }

  handleResponse(data, type: number) {
    this.loadingController.dismiss();

    if (type == POST_DATA) {
      this.is_walletRecharge = true;
      this.storage.set("tran_ref", data.tran_ref).then(() => {
        let encodedData = {
          redirect_url: encodeURIComponent(data.redirect_url),
          tran_ref: data.tran_ref,
          client_id: this.client_id,
          total_amount: this.rechargeForm.value.amount,
          incoming_platform: this.current_platform,
        };

        var url = `${this.appUrl}wallet-pay?data=${JSON.stringify(
          encodedData
        )}`;

        window.open(url, "_self");

        if (this.platform.is("cordova")) {
          this.subscription = this.platform.resume.subscribe(async () => {
            this.storage.get("tran_ref").then((ref) => {
              if (ref) {
                this.paymentService
                  .confirmPayment(ref, this.client_id)
                  .subscribe(
                    (data) => this.handleResponse(data, CONFIRM),
                    (error) => this.handleError(error)
                  );
              }
            });
          });
        }
      });
    } else if (type == CONFIRM) {
      if (data.details) {
        if (data.details.response_status == "A") {
          this.router.navigate(["/tabs/home"], { replaceUrl: true });
        } else {
          this.router.navigate(["/wallet"], { replaceUrl: true });
        }
      }
    }
  }

  handleError(error) {
    this.presentToast(error.error.message)
    this.loadingController.dismiss();
  }

  openUrl(url) {
    if (!this.platform.is("cordova")) {
      window.open(url, "_self");
      return;
    }
    const browser = this.iab.create(url, "_self");

    browser.on("loadstop").subscribe((event) => {
      browser.insertCSS({ code: "body{color: red;" });
    });
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

  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      cssClass: "custom-toast-success",
      position: "top",
      color: "dark",
      duration: 1500,
    });
    toast.present();
  }

  ngOnDestroy(): void {
    if (this.platform.is("cordova") && this.is_walletRecharge) {
      this.subscription.unsubscribe();
    }
  }


}
