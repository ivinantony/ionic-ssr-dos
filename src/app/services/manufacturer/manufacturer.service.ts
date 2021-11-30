
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HeadersService } from '../headers.service';
import { UtilsService } from '../utils.service';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ManufacturerService {
  url:string
  constructor(private utils:UtilsService,private httpclient:HttpClient,private headerservice:HeadersService) 
  {
    this.url = utils.getApiPath()
   }
   public getManufacturers(page_count:any)
   {
     const headers = this.headerservice.getHttpHeaders()
     return this.httpclient.get(
      this.url + "brand?page="+page_count,
      { headers }
     ).pipe(map(res=>{
       return res}));
   }
}

