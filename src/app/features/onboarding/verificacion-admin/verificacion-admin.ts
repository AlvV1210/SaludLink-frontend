import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verificacion-admin',
  template: '',
})
export class VerificacionAdminComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigateByUrl('/admin/dashboard', { replaceUrl: true });
  }
}
