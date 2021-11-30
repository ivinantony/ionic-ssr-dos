import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { AddressService } from 'src/app/services/address/address.service';

@Component({
  selector: 'app-locationmodel',
  templateUrl: './locationmodel.page.html',
  styleUrls: ['./locationmodel.page.scss'],
})
export class LocationmodelPage implements OnInit {
  deliveryLocations:Array<any>=[];
  selectedAddress:any;
  constructor(private addressService:AddressService,
    private modalController:ModalController,
    private toastController:ToastController) 
  { 
    this.getData()
  }

  ngOnInit() {
    if (!window.history.state.modal) {
      const modalState = { modal: true };
      history.pushState(modalState, null);
    }
    
  }

  getData() {
    this.addressService.getDeliveryLocations().subscribe(
      (data) => this.handleResponse(data),
      (error) => this.handleError(error)
    );
  }

  handleResponse(data) {
    this.deliveryLocations = data.delivery_locations;
   
  }

  handleError(error) {
    this.presentToast(error.error.message)
  }

  onChangeLoc(event) {
    this.selectedAddress = this.deliveryLocations[event.detail.value]
  
    let data={
      
    }
  }

  dismissModal(){
    this.modalController.dismiss()
  }

  onSubmit()
  {
    this.modalController.dismiss(this.selectedAddress)
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

}
