import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Router } from "@angular/router";
import { debounceTime } from "rxjs/operators";
import { SearchService } from "src/app/services/search/search.service";
import { defineCustomElements } from "@teamhive/lottie-player/loader";
import { UtilsService } from "src/app/services/utils.service";
import { AlertController } from "@ionic/angular";


@Component({
  selector: "app-search",
  templateUrl: "./search.page.html",
  styleUrls: ["./search.page.scss"],
  encapsulation: ViewEncapsulation.None
})
export class SearchPage implements OnInit {
  searching: any = false;
  isSearchResult: boolean = false;
  result: Array<any> = [];
  s3url:any;
  public searchTerm: FormControl;

  constructor(private searchService: SearchService, private router: Router,
    private utils:UtilsService,private alertController:AlertController) {
    defineCustomElements(window);
    this.s3url = utils.getS3url();
  
    this.searchTerm = new FormControl();
  }

  ngOnInit() {
    this.searchTerm.valueChanges
      .pipe(debounceTime(700))
      .subscribe((searchTerm) => {
        this.searching = false;

        if (searchTerm) {
          this.isSearchResult = false;
          this.result = [];
          this.searchService.getSearchResult(searchTerm).subscribe(
            (data) => this.handleResponseSearch(data),
            (error) => this.handleErrorSearch(error)
          );
        } else {
          this.result = [];
        }
      });
  }

  onSearchInputMobile() {
    this.searching = true;
  }

  handleResponseSearch(data) {
    if(data.data.length==0){
      this.presentAlert()
     }
    data.data.filter((item) => {
      this.result.push(item);
    });

    this.isSearchResult = true;
  }
  handleErrorSearch(error) {
    // console.log(error)
  }
 viewSearchProduct(index: number) {
    let id = this.result[index].id;
    let catId = this.result[index].category_id;
    let type = this.result[index].type;

    if (type == "P") {
      this.router.navigate(["product", id, { catId }]);
    } else if (type == "B") {
      let brand_id = id;
      let brand_name = this.result[index].brand_name;
      this.router.navigate(["brand-products", brand_id, { brand_name }]);
    } else if (type == "C") {
      let catId = id;
      let category_name = this.result[index].category_name;

      this.router.navigate(["products", catId, { category_name }]);
    }
  }
 

  onCancel() {
    this.isSearchResult = false;
    this.result = [];
  }

  ionViewDidLeave() {
    this.isSearchResult = false;
    this.result = [];
    this.searchTerm.setValue(null);
  }


  async presentAlert() {
    const alert = await this.alertController.create({
      cssClass: "alert-class",
      header: "Item Not Found",

      message:'Sorry, no item found in the database. Send your enquiry by email or WhatsApp',
      buttons: [
      {
        text: "Whatsapp",
      
        handler: () => {
          window.open(
            "https://api.whatsapp.com/send?phone=447417344825&amp;"  
          );
        }
      },
      {
        text: "E-Mail",
  
        handler: () => {
          window.open(
            "https://mail.google.com/mail/?view=cm&fs=1&to=info@dealonstore.com"
          ); 
          
        },
      },
      {
        text: "Cancel",
        role:"cancel"
      },
    ],
    });

    await alert.present();
  }

}
