import { Component, NgZone, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, LoadingController } from "@ionic/angular";
import { AuthenticationService } from "src/app/services/authentication.service";
import { VerifyOtpService } from "src/app/services/otp/verify-otp.service";
import { Storage } from "@ionic/storage";
import { CartcountService } from "src/app/services/cartcount.service";
import { NotcountService } from "src/app/services/notcount.service";
import { Badge } from "@ionic-native/badge/ngx";
import { WishlistService } from "src/app/services/wishlist/wishlist.service";
const POST_OTP = 200;
const RESEND_OTP = 210;
@Component({
  selector: "app-otp",
  templateUrl: "./otp.page.html",
  styleUrls: ["./otp.page.scss"],
})
export class OtpPage implements OnInit {
  inputOtp: number;
  phone: number;
  email: any;
  code:any;
  constructor(
    private otpService: VerifyOtpService,
    private activatedRoute: ActivatedRoute,
    private alertController: AlertController,
    private authService: AuthenticationService,
    private storage: Storage,
    private ngZone: NgZone,
    private cartCountService: CartcountService,
    private notCountService: NotcountService,
    private router: Router,
    private loadingController: LoadingController,
    private badge: Badge,
    private wishlistService:WishlistService
  ) {
    this.phone = this.activatedRoute.snapshot.params.phone;
    this.email = this.activatedRoute.snapshot.params.email;
    this.code = this.activatedRoute.snapshot.params.code;
  }

  ngOnInit() {}

  cancel() {
    this.router.navigate(["login"]);
  }

  resendOtp() {
    var data = {
      email: this.email,
      phone: this.phone,
      country_code : this.code
    };
    this.presentLoading().then(() => {
      this.otpService.resendOtp(data).subscribe(
        (data) => this.handleResponseData(data, RESEND_OTP),
        (error) => this.handleError(error, RESEND_OTP)
      );
    });
  }

  continue() {
    var data = {
      email: this.email,
      otp: this.inputOtp,
      phone: this.phone,
    };

    this.otpService.verifyOtp(data).subscribe(
      (data) => this.handleResponseData(data, POST_OTP),
      (error) => this.handleError(error, POST_OTP)
    );
  }

  handleResponseData(data, type) {
    if (type == POST_OTP) {
      this.authService.setClientId(data.client_id);
      this.authService.setCartCount(data.cart_count);
      this.authService.setWishCount(data.wish_count);
      this.authService.setNotificationCount(data.notification_count);

      this.wishlistService.setWishCount(data.wish_count)
      this.cartCountService.setCartCount(data.cart_count);
      this.notCountService.setNotCount(data.notification_count);
      this.badge.set(data.notification_count);
      this.storage.get("prev_url").then((val) => {
        // console.log(val,"prev url")
        this.ngZone.run(() => {
          this.authService.loginStatus(true);
          this.router.navigate([val] || ["/"], { replaceUrl: true });
        });
      });
    } else if (type == RESEND_OTP) {
      this.loadingController.dismiss();
      let msg = data.message;
      this.presentResendAlert(msg);
    }
  }

  handleError(error, type) {
    if (type == POST_OTP) {
      this.presentAlert("plaease check your OTP.");
    } else {
      this.loadingController.dismiss();
    }
    // console.log(error)
  }

  async presentAlert(msg: string) {
    const alert = await this.alertController.create({
      cssClass: "my-custom-class",
      header: "Invalid OTP",

      message: msg,
      buttons: ["OK"],
    });

    await alert.present();
  }

  async presentResendAlert(msg: string) {
    const alert = await this.alertController.create({
      cssClass: "my-custom-class",
      header: "Resend OTP",

      message: msg,
      buttons: ["OK"],
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
}
