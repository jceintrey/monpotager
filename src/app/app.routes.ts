import { Routes } from '@angular/router';
import { Vegetables } from './pages/vegetables/vegetables';
import Harvests from './pages/harvests/harvests';
import Statistics from './pages/statistics/statistics';
import ImportExport from './pages/import-export/import-export';
import CalendarPage from './pages/calendar/calendar';

export const routes: Routes = [
	{ path: 'vegetables', component: Vegetables },
	{ path: 'harvests', component: Harvests },
	{ path: 'statistics', component: Statistics },
	{ path: 'calendar', component: CalendarPage },
	{ path: 'import-export', component: ImportExport },
	{ path: '', redirectTo: '/vegetables', pathMatch: 'full' },
];
