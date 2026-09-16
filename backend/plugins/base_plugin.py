from abc import ABC, abstractmethod
from core.context import InspectionContext

class BasePlugin(ABC):
    """
    Abstract base class for all AI pipeline plugins.
    Every plugin (OpenCV, YOLO, OCR, NER, RuleEngine) must inherit from this class
    and implement the process method.
    """
    
    @abstractmethod
    def process(self, context: InspectionContext) -> InspectionContext:
        """
        Takes the shared InspectionContext, applies the specific AI/logic component,
        and returns the mutated context.
        """
        pass
