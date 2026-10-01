import { Routes } from '@angular/router';
import { SearchComponent } from './components/search/search.component';
import { CardDetailComponent } from './components/card-detail/card-detail.component';
import { BlueEyesComponent } from './components/blue-eyes/blue-eyes.component';

export const routes: Routes = [
  { path: '', component: SearchComponent },
  { path: 'card/:id', component: CardDetailComponent },
  { path: 'blue-eyes', component: BlueEyesComponent },
  { path: '**', redirectTo: '' },
];
