import { Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { ModalController } from "@ionic/angular";
declare var google: any;
@Component({
  selector: "app-area-search",
  templateUrl: "./area-search.page.html",
  styleUrls: ["./area-search.page.scss"],
})
export class AreaSearchPage implements OnInit {
  @ViewChild("search", { static: true }) search: any;
  public search_places: any = [];
  location_data: any = {};
  constructor(private modalController: ModalController, public zone: NgZone) {}

  ngOnInit() {
    if (!window.history.state.modal) {
      const modalState = { modal: true };
      history.pushState(modalState, null);
    }
  }
  
  onSearchChange(event) {
    let config = {
      types: ["geocode"],
      input: event.detail.value,
      componentRestrictions: { country: "AE" },
    };
    var service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(config, (predictions, status) => {
      if (status == google.maps.places.PlacesServiceStatus.OK && predictions) {
        this.search_places = [];
        predictions.forEach((prediction) => {
          this.search_places.push(prediction);
        });
      } else {
        this.search_places = [];
      }
    });
  }
  selectPlace(place) {
    this.search_places = [];
    let map = new google.maps.Map(document.getElementById("map"));
    var placesService = new google.maps.places.PlacesService(map);

    placesService.getDetails({ placeId: place.place_id }, (details) => {
      this.zone.run(() => {
        this.location_data.name = details.name;
        this.location_data.lat = details.geometry.location.lat();
        this.location_data.lng = details.geometry.location.lng();

        if (this.location_data.lat && this.location_data.lng) {
          this.modalController.dismiss(this.location_data);
        }
      });
    });
  }
  dismissModal() {
    this.modalController.dismiss();
  }
}
