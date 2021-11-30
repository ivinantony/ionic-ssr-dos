import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  PopoverController,
  ToastController,
  IonInfiniteScroll,
  ModalController,
  IonRouterOutlet,
} from "@ionic/angular";
import { IonContent } from "@ionic/angular";
import { CartcountService } from "src/app/services/cartcount.service";
import { AuthGuard } from "src/app/guards/auth.guard";
import { AuthenticationService } from "src/app/services/authentication.service";
import { CartService } from "src/app/services/cart/cart.service";
import { OfferService } from "src/app/services/offer/offer.service";
import { UtilsService } from "src/app/services/utils.service";
import { FilterComponent } from "../filter/filter.component";
import { CartmodalPage } from "../cartmodal/cartmodal.page";
import { WishlistService } from "src/app/services/wishlist/wishlist.service";
import { QuantityUnavailablePage } from "../quantity-unavailable/quantity-unavailable.page";
const GET_DATA = 200;
const POST_DATA = 210;
const BUY_NOW = 220;
const WISHLIST = 230;
@Component({
  selector: "app-offer",
  templateUrl: "./offer.page.html",
  styleUrls: ["./offer.page.scss"],
})
export class OfferPage implements OnInit {
  // @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonContent, { static: false }) content: IonContent;
  currentPage = 3;
  products: Array<any> = [];

  wishlistIndex: any;
  s3url: any;
  page_limit: number;
  page_count: number = 1;
  current_page: number;

  sortType: any = null;
  cart_count: any;
  name: any;
  collection:any

  constructor(
    private offerService: OfferService,
    private utils: UtilsService,
    public router: Router,
    private actionSheetController: ActionSheetController,
    private cartService: CartService,
    private alertController: AlertController,
    private authService: AuthenticationService,
    private loadingController: LoadingController,
    private popOverCtrl: PopoverController,
    private toastController: ToastController,
    private cartCountService: CartcountService,
    private authGuard: AuthGuard,
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private wishlistService: WishlistService
  ) {
    this.s3url = utils.getS3url();

   
    
  }

 

  ionViewWillEnter() {
    this.authService.getCartCount().then((count) => {
      if (count) {
        this.cart_count = count;
      }
    });

    this.getData(true);
   
  }

  onChangePage(e){
    // console.log(e[0])
    if(e[0]!=this.page_count){
      this.page_count= e[0];
      this.getData(false);
      this.content.scrollToTop(1500);
    }
    
  }
  ngOnInit() {
    
  }
  

  getData(isFirst) {
    this.presentLoading().then(() => {
      this.authService.isAuthenticated().then((val) => {
        if (val) {
          this.offerService
            .getOfferProducts(val, this.page_count, this.sortType)
            .subscribe(
              (data) => this.handleResponse(data, GET_DATA,isFirst),
              (error) => this.handleError(error)
            );
        } else {
          this.offerService
            .getOfferProducts(null, this.page_count, this.sortType)
            .subscribe(
              (data) => this.handleResponse(data, GET_DATA,isFirst),
              (error) => this.handleError(error)
            );
        }
      });
    });
  }

  handleResponse(data,type,isFirst) {
    if (type == GET_DATA) {
      this.loadingController.dismiss();
      this.page_limit = data.page_count;
      this.cart_count = data.cart_count;
      this.products = data.product
   
      if(isFirst && data.page_count!=0){
        let a=[]
        for (let i = 1; i <= data.page_count; i++) {
          a.push(i);
        }
        this.collection = a;
      }
      
      this.cartCountService.setCartCount(data.cart_count);
      this.authService.setCartCount(data.cart_count);
      
    } else if (type == POST_DATA) {
      this.loadingController.dismiss().then(() => {
        this.cart_count = data.cart_count;
        this.authService.setCartCount(data.cart_count);
        this.cartCountService.setCartCount(data.cart_count);
        this.presentToastSuccess("One ' " + this.name + " ' added to cart.");
      });
    } else if (type == BUY_NOW) {
      this.loadingController.dismiss().then(() => {
        this.authService.setCartCount(data.cart_count);
        this.cartCountService.setCartCount(data.cart_count);
        this.presentModal();
      });
    } else if (type == WISHLIST) {
      this.loadingController.dismiss().then(() => {
        let name = this.products[this.wishlistIndex].name;
        if (this.products[this.wishlistIndex].wishlist == true) {
          this.presentToastSuccess(name + "  removed from wishlist.");
          this.authService.setWishCount(data.wish_count);
          this.wishlistService.setWishCount(data.wish_count);
          this.products[this.wishlistIndex].wishlist = !this.products[this.wishlistIndex].wishlist;
        } else {
          this.presentToastSuccess(name + "  added to wishlist.");
          this.authService.setWishCount(data.wish_count);
          this.wishlistService.setWishCount(data.wish_count);
          this.products[this.wishlistIndex].wishlist = !this.products[
            this.wishlistIndex
          ].wishlist;
        }
      });
    }
  }

  handleError(error) {
    this.loadingController.dismiss();
    if (error.status == 400) {
      // this.presentAlert(error.error.message);
      this.presentMessage()
    }
    else{
      this.presentToast(error.error.message)
    }
  }


  buyNow(index: number) {
    this.authService.isAuthenticated().then((val) => {
      if (val) {
        this.presentLoading().then(() => {
          let data = {
            product_id: this.products[index].id,
            client_id: val
          };
          this.cartService.addToCart(data).subscribe(
            (data) => this.handleResponse(data, BUY_NOW,''),
            (error) => this.handleError(error)
          );
        });
      } else {
        this.authGuard.presentModal();
      }
    });
  }

  addToWishlist(index: number) {
    this.wishlistIndex = index;
    this.authService.isAuthenticated().then((token) => {
      if (token) {
        this.presentLoading().then(() => {
          let data = {
            product_id: this.products[index].id,
            client_id: token,
          };
          this.wishlistService.wishlist(data).subscribe(
            (data) => this.handleResponse(data, WISHLIST,''),
            (error) => this.handleError(error)
          );
        });
      } else {
        this.authGuard.presentModal();
      }
    });
  }


  async openSort(ev: any) {
    const popover = await this.popOverCtrl.create({
      component: FilterComponent,
      event: ev,
      animated: true,
      showBackdrop: true,
      cssClass: "popover",
    });
    popover.onDidDismiss().then((data) => {
      if (data.data) {
        // this.infiniteScroll.disabled = true;

        if (data.data == 2) {
          this.sortType = "ASC";
          this.page_count = 1;
          this.products = [];
          this.getData(true);
        } else if (data.data == 1) {
          this.sortType = "DESC";
          this.page_count = 1;
          this.products = [];

          this.getData(true);
        }
      }
    });
    await popover.present();
  }

  loadMoreContent() {
    if (this.page_count == this.page_limit) {
      // infiniteScroll.target.disabled = true;
    } else {
      this.page_count++;
      this.getData(false);
      this.content.scrollToTop(1500);
    }
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

  navigateToProduct(index) {
    let id = this.products[index].id;
    let catId = this.products[index].category_id;
    this.router.navigate(["product", id, { catId }]);
  }

  doRefresh(event) {
    setTimeout(() => {
      this.page_count = 1;
      this.products = [];
      this.getData(true)
      event.target.complete();
    }, 2000);
  }

  async openSortMobile() {
    const actionSheet = await this.actionSheetController.create({
      header: "SORT BY",
      mode: "md",
      cssClass: "my-custom-class",
      buttons: [
        {
          text: "Price - high to low",
          handler: () => {
           

            this.page_count = 1;
            this.products = [];
            this.sortType = "DESC";
            this.getData(true);
            this.content.scrollToTop();
          },
        },
        {
          text: "Price - low to high",
          handler: () => {
         

            this.page_count = 1;
            this.products = [];
            this.sortType = "ASC";
            this.getData(true);
            this.content.scrollToTop();
          },
        },
      ],
    });
    await actionSheet.present();
  }

  async presentToastSuccess(msg) {
    const toast = await this.toastController.create({
      message: msg,
      cssClass: "custom-toast-success",
      position: "bottom",
      duration: 1500,
      color: "dark",
    });
    toast.present();
  }

  async presentLogin() {
    const alert = await this.alertController.create({
      cssClass: "my-custom-class",
      header: "You Are Not Logged In",
      message: "Log in to continue.",
      buttons: [
        {
          text: "Login",
          handler: () => {
            this.router.navigate(["login"]);
          },
        },
      ],
    });

    await alert.present();
  }

  // async presentAlert(msg: string) {
  //   const alert = await this.alertController.create({
  //     cssClass: "alert-class",
  //     header: "Required Quantity Unavailable",

  //     message:'Sorry we are unable to process with your required quantity, please contact via <img src = "../../../assets/imgs/icons/whatsapp.svg">  or  <img src = "../../../assets/imgs/icons/gmail.svg">.',
  //     buttons: [
  //     {
  //       text: "Whatsapp",
      
  //       handler: () => {
  //         window.open(
  //           "https://api.whatsapp.com/send?phone=447417344825&amp;"  
  //         );
  //       }
  //     },
  //     {
  //       text: "E-Mail",
  
  //       handler: () => {
  //         window.open(
  //           "https://mail.google.com/mail/?view=cm&fs=1&to=info@dealonstore.com"
  //         ); 
          
  //       },
  //     },
  //     {
  //       text: "Cancel",
  //       role:"cancel"
  //     },
  //   ],
  //   });

  //   await alert.present();
  // }

  async presentModal() {
    const modal = await this.modalController.create({
      component: CartmodalPage,
      cssClass: "cartmodal",
      componentProps: { value: 123 },
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
    });

    await modal.present();
  }

  ionViewWillLeave() {
    this.page_count = 1;
    this.products = [];
  
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

  async presentMessage() {
    const modal = await this.modalController.create({
      component: QuantityUnavailablePage,
      cssClass: "custom_alert",
      swipeToClose: true,
      mode:"ios"
    });

    await modal.present();
  }
}
