import Swal, { type SweetAlertIcon } from "sweetalert2";

export const AppToast = Swal.mixin({
  toast: true,
  position: "top-right",
  showConfirmButton: true,
  confirmButtonText: "Entendido",
  timer: 4200,
  timerProgressBar: true,
  customClass: {
    popup: "swal2-toast",
    title: "swal-custom-title",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export const showAppToast = (icon: SweetAlertIcon, title: string, text?: string) =>
  AppToast.fire({
    icon,
    title,
    text,
  });
