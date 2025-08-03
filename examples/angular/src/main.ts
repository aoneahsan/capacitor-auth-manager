import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { AuthModule } from 'capacitor-auth-manager/angular';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      AuthModule.forRoot({
        providers: {
          google: {
            clientId: 'your-google-client-id'
          },
          github: {
            clientId: 'your-github-client-id'
          },
          facebook: {
            appId: 'your-facebook-app-id'
          },
          microsoft: {
            clientId: 'your-microsoft-client-id'
          }
        },
        persistence: 'local',
        enableLogging: true
      })
    )
  ]
});