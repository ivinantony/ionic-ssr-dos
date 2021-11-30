import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NotificationdetailPage } from './notificationdetail.page';

describe('NotificationdetailPage', () => {
  let component: NotificationdetailPage;
  let fixture: ComponentFixture<NotificationdetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationdetailPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationdetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
