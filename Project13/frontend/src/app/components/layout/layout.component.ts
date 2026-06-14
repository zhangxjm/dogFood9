import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User, RoleLabels } from '../../models/user.model';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  currentUser: User | null = null;
  roleLabel = '';
  activeRoute = '';

  navItems = [
    { label: '工作台', icon: 'dashboard', route: '/dashboard' },
    { label: '患者管理', icon: 'people', route: '/patients' },
    { label: '影像中心', icon: 'medical_services', route: '/studies' },
    { label: '结节检测', icon: 'search', route: '/nodules' },
    { label: '诊断报告', icon: 'description', route: '/reports' },
    { label: '专家会诊', icon: 'groups', route: '/consultations' },
    { label: '病例对比', icon: 'compare', route: '/comparison' }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.roleLabel = RoleLabels[this.currentUser.role] || this.currentUser.role;
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
