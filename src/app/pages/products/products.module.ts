import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProductsPageRoutingModule } from './products-routing.module';

import { ProductsPage } from './products.page';
import { SharedComponentsModule } from 'src/app/components/shared-components.module';
import { JwPaginationModule } from 'jw-angular-pagination';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    JwPaginationModule,
    ProductsPageRoutingModule,
    SharedComponentsModule
  ],
  declarations: [ProductsPage]
})
export class ProductsPageModule {}
