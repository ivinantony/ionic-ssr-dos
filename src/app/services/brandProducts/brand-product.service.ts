import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HeadersService } from '../headers.service';
import { UtilsService } from '../utils.service';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class BrandProductService {

  url:string
  constructor(private utils:UtilsService,private httpclient:HttpClient,private headerservice:HeadersService)
   {
     this.url = utils.getApiPath()
   } 

   public getBrandProducts(brand_id:number,page_no:number,client_id:any,sort:any)
   {
     const headers = this.headerservice.getHttpHeaders()
     return this.httpclient.get(
      this.url + "brand-products?brand_id="+brand_id+"&page="+page_no+"&client_id="+client_id+"&sort="+sort,
      { headers }
     ).pipe(map(res=>{
       return res}));
   }
}
