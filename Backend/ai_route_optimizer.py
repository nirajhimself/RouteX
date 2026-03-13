from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np


def create_distance_matrix(locations):
    matrix = []
    for i in locations:
        row = []
        for j in locations:
            distance = np.sqrt(
                (i[0] - j[0])**2 +
                (i[1] - j[1])**2
            ) * 111
            row.append(int(distance))
        matrix.append(row)
    return matrix


def optimize_vrp(locations, demands, vehicle_capacity, num_vehicles):

    distance_matrix = create_distance_matrix(locations)

    data = {
        "distance_matrix": distance_matrix,
        "demands": demands,
        "vehicle_capacities": [vehicle_capacity] * num_vehicles,
        "num_vehicles": num_vehicles,
        "depot": 0,
    }

    manager = pywrapcp.RoutingIndexManager(
        len(data["distance_matrix"]),
        data["num_vehicles"],
        data["depot"]
    )

    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data["distance_matrix"][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)

    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    solution = routing.SolveWithParameters(
        pywrapcp.DefaultRoutingSearchParameters()
    )

    routes = []
    total_distance = 0

    if solution:
        for vehicle_id in range(num_vehicles):
            index = routing.Start(vehicle_id)
            route = []

            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                route.append(node)
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                total_distance += routing.GetArcCostForVehicle(
                    previous_index, index, vehicle_id
                )

            routes.append(route)

    return {
        "routes": routes,
        "total_distance": total_distance
    }