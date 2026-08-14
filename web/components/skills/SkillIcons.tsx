import CommandLineIcon from "@heroicons/react/24/outline/CommandLineIcon";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import CursorArrowRaysIcon from "@heroicons/react/24/outline/CursorArrowRaysIcon";
import SwatchIcon from "@heroicons/react/24/outline/SwatchIcon";
import ShieldCheckIcon from "@heroicons/react/24/outline/ShieldCheckIcon";
import LanguageIcon from "@heroicons/react/24/outline/LanguageIcon";
import PaintBrushIcon from "@heroicons/react/24/outline/PaintBrushIcon";
import ViewColumnsIcon from "@heroicons/react/24/outline/ViewColumnsIcon";
import FilmIcon from "@heroicons/react/24/outline/FilmIcon";
import ClipboardDocumentListIcon from "@heroicons/react/24/outline/ClipboardDocumentListIcon";
import Bars3BottomLeftIcon from "@heroicons/react/24/outline/Bars3BottomLeftIcon";
import ChartBarSquareIcon from "@heroicons/react/24/outline/ChartBarSquareIcon";
import DevicePhoneMobileIcon from "@heroicons/react/24/outline/DevicePhoneMobileIcon";
import ArrowsPointingOutIcon from "@heroicons/react/24/outline/ArrowsPointingOutIcon";
import RocketLaunchIcon from "@heroicons/react/24/outline/RocketLaunchIcon";
import ChatBubbleBottomCenterTextIcon from "@heroicons/react/24/outline/ChatBubbleBottomCenterTextIcon";
import MapIcon from "@heroicons/react/24/outline/MapIcon";
import ChatBubbleLeftRightIcon from "@heroicons/react/24/outline/ChatBubbleLeftRightIcon";
import HeartIcon from "@heroicons/react/24/outline/HeartIcon";
import BuildingOffice2Icon from "@heroicons/react/24/outline/BuildingOffice2Icon";
import ShoppingBagIcon from "@heroicons/react/24/outline/ShoppingBagIcon";
import CreditCardIcon from "@heroicons/react/24/outline/CreditCardIcon";
import MoonIcon from "@heroicons/react/24/outline/MoonIcon";
import ExclamationTriangleIcon from "@heroicons/react/24/outline/ExclamationTriangleIcon";
import FlagIcon from "@heroicons/react/24/outline/FlagIcon";
import BoltIcon from "@heroicons/react/24/outline/BoltIcon";
import ChartPieIcon from "@heroicons/react/24/outline/ChartPieIcon";
import TableCellsIcon from "@heroicons/react/24/outline/TableCellsIcon";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import SparklesIcon from "@heroicons/react/24/outline/SparklesIcon";
import GlobeAltIcon from "@heroicons/react/24/outline/GlobeAltIcon";
import LockClosedIcon from "@heroicons/react/24/outline/LockClosedIcon";
import ArrowsUpDownIcon from "@heroicons/react/24/outline/ArrowsUpDownIcon";
import PrinterIcon from "@heroicons/react/24/outline/PrinterIcon";
import ComputerDesktopIcon from "@heroicons/react/24/outline/ComputerDesktopIcon";
import BookOpenIcon from "@heroicons/react/24/outline/BookOpenIcon";
import CircleStackIcon from "@heroicons/react/24/outline/CircleStackIcon";
import KeyIcon from "@heroicons/react/24/outline/KeyIcon";
import LockOpenIcon from "@heroicons/react/24/outline/LockOpenIcon";
import CloudArrowUpIcon from "@heroicons/react/24/outline/CloudArrowUpIcon";
import WrenchScrewdriverIcon from "@heroicons/react/24/outline/WrenchScrewdriverIcon";
import NoSymbolIcon from "@heroicons/react/24/outline/NoSymbolIcon";
import PencilSquareIcon from "@heroicons/react/24/outline/PencilSquareIcon";
import ScaleIcon from "@heroicons/react/24/outline/ScaleIcon";
import QuestionMarkCircleIcon from "@heroicons/react/24/outline/QuestionMarkCircleIcon";
import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import { type ComponentType, type SVGProps } from "react";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const SKILL_ICON_MAP: Record<string, HeroIcon> = {
  "design-brief": CommandLineIcon,
  "visual-hierarchy-specialist": EyeIcon,
  "interaction-designer": CursorArrowRaysIcon,
  "design-system-architect": SwatchIcon,
  "accessibility-specialist": ShieldCheckIcon,
  "typography-specialist": LanguageIcon,
  "color-specialist": PaintBrushIcon,
  "spacing-layout-specialist": ViewColumnsIcon,
  "motion-designer": FilmIcon,
  "form-designer": ClipboardDocumentListIcon,
  "navigation-specialist": Bars3BottomLeftIcon,
  "dashboard-designer": ChartBarSquareIcon,
  "mobile-specialist": DevicePhoneMobileIcon,
  "responsive-design-specialist": ArrowsPointingOutIcon,
  "landing-page-specialist": RocketLaunchIcon,
  "content-strategist": ChatBubbleBottomCenterTextIcon,
  "information-architect": MapIcon,
  "conversational-ui-designer": ChatBubbleLeftRightIcon,
  "healthcare-ux-specialist": HeartIcon,
  "b2b-saas-specialist": BuildingOffice2Icon,
  "ecommerce-specialist": ShoppingBagIcon,
  "checkout-specialist": CreditCardIcon,
  "dark-mode-specialist": MoonIcon,
  "error-handling-specialist": ExclamationTriangleIcon,
  "onboarding-specialist": FlagIcon,
  "performance-specialist": BoltIcon,
  "data-visualization-specialist": ChartPieIcon,
  "table-designer": TableCellsIcon,
  "search-specialist": MagnifyingGlassIcon,
  "brand-designer": SparklesIcon,
  "i18n-designer": GlobeAltIcon,
  "auth-security-ux-specialist": LockClosedIcon,
  "drag-drop-specialist": ArrowsUpDownIcon,
  "print-export-designer": PrinterIcon,
  "setup-guide": ComputerDesktopIcon,
  "code-explainer": BookOpenIcon,
  "database-setup": CircleStackIcon,
  "environment-setup": KeyIcon,
  "auth-implementation": LockOpenIcon,
  "deploy-to-vercel": CloudArrowUpIcon,
  "debug-helper": WrenchScrewdriverIcon,
  "anti-slop-designer": NoSymbolIcon,
  "ui-copywriter": PencilSquareIcon,
  "design-critic": ScaleIcon,
  "design-grill": QuestionMarkCircleIcon,
  "briefing-claude": DocumentTextIcon,
};

export function SkillIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Icon = SKILL_ICON_MAP[slug];
  if (!Icon) return null;
  return <Icon className={className} />;
}
